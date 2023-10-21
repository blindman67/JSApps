/***********************************************************************************************************************
    Directives 
        GeeQry supports alias definitions from V2.4
        GeeQry can not be used in some environments, eg Node.js and will throw the build error "Incompatable build option GeeQry"
 
        "** GeeQry"          will insert GeeQry function to the global scope
        "** GeeQry Global"   will insert GeeQry function to the global scope
        "** GeeQry Scoped"   will insert GeeQry to the scope the directive is located in
        "** GeeQry Force"    will add GeeQry even if there is no reference to it in the source
        "** GeeQry Module"   will add GeeQry as a module. See [WEB DEV, ECMAScript, Modules] 
        "** GeeQry Extended" will add extentions to functions if avalible
        
 ***********************************************************************************************************************/        


/***********************************************************************************************************************
Function abstract [[create], [query]] named $()  Has multipule signitures and argument interpritations.

    $(agr1, [arg2]) one or two arguments

    
    Signiture 1 Creating element 
    
        Sugnature
            $(tagType, [properties])
            
        Arguments 
            tagName:     arg1 , type String
            properties: [arg2], type Object,  [optional default {}]
            
        Return
            Element            
            
        Description
            Used to create new elements by tag name and assign properties to the newly created element.
            Assigned properties can include no standard DOM properties. Not does not set attributes or dataset atributes
            Assigned properties can include nested style
            All propertiesuse the camelCase naming.
            NOTE: 
                Properties assigned undefined will be assigned to the element. 
                The DOM uses null to mean default
    
        Examples 

            const myElement = $("div")                        // creates empty div element
            // The element markup is  <div></div>
            
            const myElement = $("span", {textContent: "foo"}) // creates span with text content "foo"
            // The element markup is  <span>foo</span>
            
            // Create a heading with text heading and styles
            // The element markup is  <h1 id="myId" style="background-color:#5A3;">Heading</h1>
            const myElement = $("h1", {id: "myId", textContent: "Heading", style: {backgroundColor: "#5A3"}}) 
            
            
            

    Signiture 2 Query DOM for element / elements
    
        Signature
            $(query, [parent])  
            
        Arguments 
            query:   arg1 , type String, pre-fixed "?" or "?+"
            parent: [arg2], type [HTMLElement] | [HTMLNode] | [Array], [optional default document]
            
        Return
            Element or array of elements depending on query. 
            If the query is for all (pre-fixed "?+") then will always return an array. Empty if not matches found
            If the query is for a single (pre-fixed "?") then will return element found or undefined. (WILL NOT return null)
            If the argument parent is an array then will return as defined by query type ("?" or "?+") 
                The first element matching the query from elements in the array. If no matches found undefined is returned
                All the elements matching the query in all the element in the array. If no matches found then an empty array is returned
            
        Description             
            A query is defined when the string query is prefixed "?" or "?+"
            There are two types of query depending on the prefix
                "?" query for first occurance
                "?+" query all
            The prefix may be started and followed by one or more white space characters. eg "? + #myId" or " ? #myId"
            
        Examples
            const div = $("?div")               // returns first div on page                                                                    
            const div = $("?div", myDiv)        // returns first div in element myDiv
            const imgs = $("?+img")             // returns all images
            const imgs = $("?+img", $("?div"))  // returns all images within the first div on the page
            const imgs = $("?+img", $("?+div")) // returns all images within the all divs on the page
            const element = $("?#myId")         // returns element with id
            $("?+.a-class", myDiv)  // returns all elements with class .a-class in element myDiv
            
***********************************************************************************************************************/

/***********************************************************************************************************************
Function abstract Append siblings | Add remove listeners   Has multipule signitures and argument interpritations.

    $(agr1, ...args2) one or more arguments
    
    Signature 1 - 2 Alias for $
        Signature 1 - 2
            $$(query), or $$(parent)  
            If the argument is a string it will be used to call $() assigning the result to parent. In effect this function can be used as an alias of $() without the second properties argument
            
        Arguments 
            query | parent: arg1, type [String] | [HTMLElement] | [HTMLNode]
            
        Return
            Element the first argument parent. If this was a string then returns the result of $(query). 
 
        Description             
            If using as a query return result of $(query)
            If argument is not a string then returns parent
            
        Examples
            See GeeQry.$
            
    Signature 3 Append      
            
        Signature 3
            $$(parent, ...sibs)  
            
        Arguments 
            parent  arg1 , type [HTMLElement] | [HTMLNode]
            sibs    args2, a set of elements toappend to the parent
            
        Return
            Element the first argument parent. 
 
        Description             
            Append elements to parent returning the parent
            
        Examples
            // creates a new div tag with two spans appened 
            const myDiv = $$($("div"), $("span"), $("span"))
                 
    Signature 4 Append to result of GeeQry.$     
            
        Signature 4
            $$(tagName, ...sibs)  
            $$(query, ...sibs)  
            
        Arguments 
            tagName  arg1 , type String, name of tag to create using $(tagName)
            query    arg1 , type String, query used too get parent to append to $(query)
            sibs     args2, a set of elements to append to the resulting parent
            
        Return
            The parent created
            If no element has been created undefined or an empty array is return.
            
 
        Description             
            Append elements to the element created using GeeQry $()
            
        Examples
            See GeeQry.$
           
    Signature 5 Add Remove event listeners
    
        Signature 5
            $$(tagName, eventName, listener, [eventArgs])  
            $$(query, eventName, listener, [eventArgs])  
            $$(parent, eventName, listener, [eventArgs])  
            $$(parents, eventName, listener, [eventArgs])  
            
        Arguments 
            parent, parents, tagName, query  arg1 , type [String] | [Array] |, [HTMLElement] | [HTMLNode]
            eventName  args2 (even) , type String, name of event to add/remove  listener. The pre-fix "-" to indicate remove
            listener   args2 (odd)  , type Function, the function to add or remove
            
        Return
            arg1 as parent
            
        Examples
            // create a div and add a click event
            const myDiv = $$("div", "click", e => console.log("hello"));
            
            // Adds and then removes click event from the element referenced by myDiv
            const clickEvent = e => console.log("hello");
            $$(myDiv, "click", clickEvent);
            $$(myDiv, "-click", clickEvent);
            
            // Adds click event to all div elements on page
            const clickEvent = e => console.log("hello");
            const allDivs = $$("?+div", "click", clickEvent);
            
            // removes click event from the elements in array allDivs           
            $$(allDivs, "-click", clickEvent);
    
   
 ***********************************************************************************************************************/  
     
// $.eachIf default pred callback
var uid = 1;
const getUID = () => ++uid;
const predDefault = item => item !== undefined; 
const names = {
    camelExceptions: {
        
    },
    cssExceptions: {
        
    },
    camelToCSS(name) {
        if (names.camelExceptions[name]) { return name } // to do 
        return name.replace(/[A-Z]/g, str => "-" + str).toLowerCase();
    },
    cssToCamel(name) {
        if (names.cssExceptions[name]) { return name } // to do 
        return name.replace(/-([A-Z])/g, () => "$1");
    },
};
const aliasTransform = {
    sizeUnit: "px",
    timeUnit: "s",
    angleUnit: "rad",
    active: false,
    toSizeUnit(value) { return isNaN(value) ? value : value + this.sizeUnit },
    toCol(value) { return value[0] === "#" ? value : "#" + value },
    toTimeUnit(value) { return isNaN(value) ? value : value + this.timeUnit },
    toAngleUnit(value) { return isNaN(value) ? value : value + this.angleUnit },
};
const AT = aliasTransform;
const transformed = (key, value) => ({key, value, complex: false});
const positionAlias = {abs:"absolute", rel: "relative", fix: "fixed"}
const ST = name => val => transformed(name, AT.toSizeUnit(val));
const CSSRuleNamePrefix = " .#"
const styles = new Map();
const styleTransform = {
    w: ST("width"),
    h: ST("height"),
    top: ST("top"),
    left: ST("left"),
    right: ST("right"),
    bottom: ST("bottom"),
    bot: ST("bottom"),
    indent: ST("textIndent"),
    padInline: ST("paddingInline"),
    leftM: ST("marginLeft"),
    rightM: ST("marginRight"),
    pad: ST("padding"),
    fontSize: ST("fontSize"),
    bgCol(value) { return transformed("backgroundColor", AT.toCol(value)) },
    bg(value) { return transformed("background", AT.toCol(value)) },
    col(value) { return transformed("color", AT.toCol(value)) },
    font(value) { return transformed("fontFamily", value) },
    pos(value) { return transformed("position", positionAlias[value] ? positionAlias[value] : value) }, 
    rot(value) { return transformed("transform", "rotate(" + AT.toAngleUnit(value) + ")") },
    fit(pos) {
        pos = isArr(pos) ? pos : [0,0,0];
        return {
            props: [
                 styleTransform.pos("abs"),
                 styleTransform.top(pos[0]), 
                 styleTransform.left(pos[1]),
                 styleTransform.right(pos[2]),
            ], 
            complex: true
        };
    },                 
    topLeft(values) {        
        values = Array.isArray(values) ? values : (values.replace(/  +/g," ").split(/ |,/));
        return {
            props: [ styleTransform.top(values[0]), styleTransform.left(values[1]) ],
            complex: true,
        };
    },
    mouse(value) { return transformed("cursor", value) },
    animTime(value) { return transformed("animationDuration", AT.toTimeUnit(value)) },
    animName(value) { return transformed("animationName", value) },
};
const tagTypes = {
    tNode(data) { const t = data.textContent; delete data.textContent; return document.createTextNode(t) },
};
// Abbreviations Cheat sheets (Screen popper and printable) at localhost/JSDocs/CheatSheets/geeQry/
// cNA >> className  ([c]lass [N]ame [A]rray) return concated class name
// cn >> className ([c]lass [n]ame)
// cl >> className ([cl]ass name)
// text >> textContent ([text]Content)
const propTransform = {
    cNA(value) { return transformed("className", isArr(value) ? value.join(" ") : value) },
    cn(value) { return transformed("className", value) },
    cl(value) { return transformed("className", value) },
    text(value) { return transformed("textContent", value.toString()) },
};
function transform(obj = {}, how) {
    const result = {};
    for (const key of Object.keys(obj)) {
        if (typeof how[key] === "function") {
            const {key: newKey, value: newValue, complex, props} = how[key](obj[key]);
            if (complex) {
                for (const pair of props) { result[pair.key] = pair.value }
            } else {
                result[newKey] = newValue;
            }
        } else {
            result[key] = obj[key];
        }
    }
    return result;
}
const isArr = item => Array.isArray(item);
const isObj = item => item !== null && !isArr(item) && typeof item === "object";
const deepAssign = (dest, source) => {
    if (isArr(dest)) {
        if (!isArr(source) && isObj(source)) {
            source = [source];
        }
        if (isArr(source)) {
            for (const dItem of dest) {
                for (const sItem of source) {
                    deepAssign(dItem, sItem);
                }
            }
        }
    } else if(isObj(dest) && isObj(source)) {
        $.eachPro(source, (key, val) => {
            const dVal = dest[key];
            if (isObj(val) || isArr(val)) {
                if (isObj(dVal) || isArr(dVal)) {
                    deepAssign(dVal, val);
                } else if (isArr(val)) {
                    throw new Error("Unsupported deep assign: Array to defined basic type destination property.");
                } else {
                    dest[key] = {};
                    deepAssign(dest[key], val);
                }
            } else if(isObj(dVal)) {
                throw new Error("Unsupported deep assign: Basic type to destination property type Object.");
            } else if(isArr(dVal)) {
                throw new Error("Unsupported deep assign: Basic type to destination property type Array.");
            } else if(val === undefined) {
                if (isObj(dVal) || isArr(dVal)) {
                    throw new Error("Unsupported deep assign: Can not use source property value undefined to delete destination property typed Array or Object.");
                } else if(dVal !== undefined) {
                    delete dest[key];
                }
            } else {
                dest[key] = val;
            }
        });
    } else {
        throw new Error("Unsupported deep assign: Can deepAssign to a basic type)");        
    }
}
const assignEl = (el, props) => {
    if (props !== undefined) {
        $.eachIf(
            Object.keys(props),
            key => { el[key] = props[key] },
            key => el[key] !== undefined && (props[key] === null || typeof props[key] !== "object")
        );
    }
    return el;
}
const $ = Object.freeze(Object.assign(((qryTag, pEl) => { 
        if (qryTag.trim()[0] === "*") {
            const styleName = qryTag.trim().slice(1).trim();
            if(styles.has(styleName)) { return styles.get(styleName) }
            return createStyleSheet(styleName);
        } 
        if (qryTag.trim()[0] === "?") {
            const qry = qryTag.trim().slice(1).trim();
            const el = pEl ? pEl : document, els = Array.isArray(el) ? el : [el];
            let res;
            if (qry[0] === "+") { 
                const results = [], mQry = qry.slice(1).trim();
                for (const el of els) { (res = el.querySelectorAll(mQry)) && results.push(...res) }
                return results;
            }            
            for (const el of els) {
                if (res = el.querySelector(qry)) { return res }                    
            }
            return;
        }
        const aT = aliasTransform.active;
        const p = pEl && aT ? transform(pEl, propTransform) : (pEl ? {...pEl} : {});
        const el = assignEl(tagTypes[qryTag] ? tagTypes[qryTag](p) : document.createElement(qryTag), p);    
        p.style && assignEl(el.style, (aT ? transform(p.style, styleTransform) : p.style));
        return Array.isArray(p.$) ? $$(el, ...p.$.map(q => $(...q))) : el;
    }), { 
        doFor(count, fn) { var i = 0; while (i < count && fn(i++) !== true); },
        setOf(count, fn = (i) => i) {var a = [], i = 0; while (i < count) { a.push(fn(i ++)) } return a },
        each(arr, fn) { var i = 0; for (const item of arr) { if (fn(item, i++) === false) { return i - 1 }} },
        eachProp(obj, fn, keys = Object.keys(obj)) { for (const k of keys) { if (fn(k, obj[k]) === false) { return }} },
        deepAssign, // Careful has no cyclic check and is a picky eater as it throws a piles of errors
        eachIf(arr, fn, pred = predDefault) { 
            var i = 0; 
            while (i < arr.length) {
                if (pred(arr[i], i) === true && fn(arr[i], i) === false) { return i }
                i++;
            }
        },
        safeID(prefix) { return prefix + getUID() },
		randItem(array) { return array[(Math.random() * array.length) | 0] },
		randPick(array) { return array.splice((Math.random() * array.length) | 0,1)[0] },
		rand(min, max) { return Math.random() * (max - min) + min },
		randShuffle(a, l = a.length) { while (l) { a.push(a.splice(Math.random() * (l--) | 0, 1)[0]) } return a },
            
    })
);

const $$ = Object.freeze(Object.assign(((parent, ...sibs) => { 
        var P = parent; // alias for parent
        const insertCSSRule = (name, rules, join = "") => {
            P.insertRule(name + "{" + rules.join(join) + "}", P.cssRules.length)
        }; 
        if (P instanceof CSSStyleSheet || typeof P === "string" && P.trim()[0] === "*") {
            if (typeof P === "string" && P.trim()[0] === "*") { P = $(P) }
            if (sibs.length === 0) { return P }
            for (const rule of sibs) {
                const cascade = [];
                for (const name of Object.keys(rule)) {
                    cascade.push([name, name, rule]);
                    
                    const rules = [], atRule = name[0] === "@";
                    let next = 0;
                    while (cascade.length) {
                        const [ruleName, keyName, ruleObj] = cascade.shift();
                        atRule ? next = rules.length : rules.length = 0;
                        const newRule = aliasTransform.active ? transform(ruleObj[keyName], styleTransform) : ruleObj[keyName]
                        for (const key of Object.keys(newRule)) {      
                            if (typeof newRule[key] !== "object") { rules.push(names.camelToCSS(key) + ":" + newRule[key]) }
                            else { 
                                if (! CSSRuleNamePrefix.includes(key[0])) { cascade.push([ruleName + ">" + key, key, newRule]) }
                                else { cascade.push([ruleName + key, key, newRule]) }
                            }
                        }
                        if (rules.length) {
                            if (atRule) {
                                let idx = next, ruleStr = "", delim =  keyName + "{";
                                while (idx < rules.length) {
                                    ruleStr += delim + rules[idx++];
                                    delim = ";"
                                }
                                rules.length = next;
                                rules.push(ruleStr + "}");
                            } else { insertCSSRule(ruleName, rules, ";") }
                        }
                    }
                    if (atRule && rules.length) { insertCSSRule(name, rules) }
                }
            }
            return P;
        }
        typeof P === "string" && (P = $(P));
        if (P) {
            if (typeof sibs[0] === "string") { 
                const type = sibs[0].trim(), func = sibs[1];
                if (func === "function") { 
                    const els = Array.isArray(P) ? P : [P];
                    if (type[0] === "-") { 
                        for (const el of els) { el.removeEventListener(type.slice(1).trim(), func) }
                    } else {
                        for (const el of els) { el.addEventListener(type, func, sibs[2] ? sibs[2] : undefined) }                
                    }
                }
                return P;
            } else if(Array.isArray(P)) { return P }
            for( const sib of sibs) { sib && P.appendChild(sib) }
        }
        return P;
    }), { })
);
const createStyleSheet = Object.freeze(Object.assign(((name, byName = false) => { 
        if (byName) { return styles.get(name) }         
        var style = $("style", {text:""});
        document.head.appendChild(style);
        styles.set(name,style.sheet);
        return style.sheet;
    })

));

        
        