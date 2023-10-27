var code = `
    function v(a, b, c) {
        const k = {
            a(c, d) {
                var c = 4;
                const f = 4;
            },
            b: {
                a: 2,
            },
            c,
        };
        return k;
    }
    function v1(a, b, c) {
        const k = {
            a(c, d) {
                var c = 4;
                const f = 4;
            },
            b: {
                a: 2,
            },
            c,
        };
        return k;
    }

`
;
const debug = true;
log.clear();
var strings = locateStrings(code);
code = strings.code;
strings = strings.stringsById;

code = code.replace(/\/\*(.|\n)*\*\/\n/m,"");
code = code.replace(/(\S),/g, "$1 ,");
code = code.replace(/\(/g, " ( ");
code = code.replace(/\)/g, " )");
code = code.replace(/\[/g, " [ ");
code = code.replace(/\]/g, " ]");
code = code.replace(/:/g, " : ");
code = code.replace(/\+\+/g, " ++ ");
code = code.replace(/\-\-/g, " -- ");
code = code.replace(/\.\.\./g, " #...# ");
code = code.replace(/=>/g, " => ");
code = code.replace(/else if/g, "elseif");
code = code.replace(/  /g, " ");
const updateRaw = code.replace(/;/g,"").split("\n")
const update = updateRaw.map(line => line.trim()).filter(line => line !=="");
const allLines = update;
const countMatches = (str, reg) => str.match(reg)?.length ?? 0;
const createAssignRegExp = name => new RegExp(name + " [+\\-\\*\\/%\\|\\&]=|" + name + " =","");


function locateStrings(code) {
    var i = 0;
    var inStr = false
    var value, type, starts, escape, str;
    const uniqueStrs = new Map();
    const stringsById = new Map();
    const strings = [];
    while (i < code.length) {
        const char = code[i];
        if (!inStr) {
            if (char === "\"" || char === "'" || char === "`") {
                inStr = true;
                value = "";
                type = char;
                starts = i;
                escape = false;
            }
        } else {
            if (!escape) {
                if (char === "\\") { escape = true }
                if (char === type) {
                    value = char + value + char;
                    str = uniqueStrs.get(value);
                    if (!str) {
                        uniqueStrs.set(value, str = {
                            id: uniqueStrs.size,
                            value,
                            toString() { return this.value }
                        });
                        stringsById.set(str.id, str);
                    }
                    const id = " ###S" + str.id + "### "
                    strings.push({
                        id,
                        value,
                        type,
                        starts,
                        ends: i,
                    });
                    log("Found string: { id: "+str.id+", value: " + value + " } " );
                    inStr = false;
                    value = "";
                } else {
                    value += char;
                }
            } else {
                value += char;
                escape = false;
            }
        }
        i++;
    }
    ;
    for (const details of strings.reverse()) {
        code = code.slice(0, details.starts) + details.id + code.slice(details.ends + 1);
    }


    return {stringsById, code};
}
const base = Symbol("BaseNode");
const hashedTokenTypes = {
    string: new Set(["###S"]),
}
const tokenTypes = {
    operator: new Set("+,-,/,*,**,%,--,++,&,|,~,<<,>>,>>>".split(",")),
    assign: new Set("=,+=,-=,*=,/=,**=,%=,&=,|=,<<=,>>=,>>>=,&&=,||=".split(",")),
    logic: new Set("==,!=,===,!==,<,>,<=,>=,!,&&,||".split(",")),
    spread: new Set(["#...#"]),
    arrow: new Set(["=>"]),
    group: new Set(["("]),
    block: new Set(["{"]),
    bracket: new Set(["["]),
    closeGroup: new Set([")"]),
    closeBlock: new Set(["}"]),
    closeBracket: new Set(["]"]),
    ternary: new Set(["?"]),
    colon: new Set([":"]),
    comma: new Set([","]),
    newLine: new Set(["\n"]),
    consumables: new Set([" ", "  "])
}
function tokenType(token) {
    if (token === "") { return "consumables" }
    if (token.startsWith("###") && token.endsWith("###")) {
        const hashType = token.slice(0,4);
        for (const [name, tokenSet] of Object.entries(hashedTokenTypes)) {
            if (tokenSet.has(hashType)) { return name }
        }
        return "hashed";
    }
    if (nodeTypes[token]) { return token }
    for (const [name, tokenSet] of Object.entries(tokenTypes)) {
        if (tokenSet.has(token)) { return name }
    }
    if (isNaN(token)) { return "identifier" }
    return "number";
}
var indent = "";
function *tokenizer(lines) {
    const res = tokenizer.results;
    const tokenized = res.tokenized;
    const prevTokenized = res.prevTokenized;
    var xx = 0
    var line, tokens;
    const l = [...lines].reverse();
    while (l.length) {
        line = l.pop() + " \n";
        tokens = line.split(" ").reverse();
        while (tokens.length) {
            if (xx++ > 9999) { log("Too long tokenizer cyclic protect returned"); return }
            if (res.action === res.keep) {
                tokens.push(token);
                res.action = res.consume;
            }
            const token = tokens.pop();
            const type = tokenType(token);
            if (type !== "consumables") {
                prevTokenized[0] = tokenized[0];
                prevTokenized[1] = tokenized[1];
                tokenized[0] = type;
                tokenized[1] = token;
                yield tokenized;
                if (res.action === res.keep) {
                    tokens.push(token);
                    res.action = res.consume;
                }
            }
        }
    }
}
tokenizer.results = {
    consume: 0,
    keep: 1,
    action: 0,
    tokenized: [],
    prevTokenized: [],
};
function Identifiers(prefix) {
    return {
        id: 1,
        prefix,
        closed: false,
        named: new Map(),
        get hasContent() { return this.named.size > 0 },
        get empty() { return this.named.size === 0 },
        toString() { return [...this.named.values()].join(",") },
        add(name) {
            var named;
            named = this.named.get(name) ?? (this.named.set(name, named = {
                    name,
                    id: this.id++,
                    refName: this.prefix + (this.id - 1).toString(32),
                    toString() { return this.refName },
                }),
                named
            )
            return named.refName;
        }
    }
}
const scopes = {
    prefixes: "ABCDEFGHIJKLMNOPQERSTUVWXYZ".split(""),
    identifiers: [],
    lastClosed: null,
    addScope() {
        const prefix = scopes.prefixes.pop();
        const scope = Identifiers(prefix);
        scopes.identifiers.push(scope);
        return scope;
    },
    closeScope(scope) {
        scope.closed = true;
        scopes.prefixes.push(scope.prefix);
        scopes.identifiers.pop();
        scopes.lastClosed = scope;
    },
    openScope(scope) {
        if (scope !== scopes.lastClosed) {
            throw new Error("Can not open scopes out of order");
        }
        scopes.lastClosed = null;
        scope.closed = false;
        scopes.identifiers.push(scope);
        scopes.prefixes.pop();

    },
    addName(name) { return scopes.identifiers[scopes.identifiers.length - 1].add(name) },
    getName(name) {
        var i = scopes.identifiers.length;
        while (i--) {
            const scope = scopes.identifiers[i];
            if (!scope.closed && scope.named.has(name)) { return scope.named.get(name).refName }
        }
        return name;
    }
}
const nodeCommon = {
    value: "",
    prefix: "",
    text() { return "Node: " + this.type + ":" + this.value },
    removeEmpty() {
        var i = 0;
        if (this.nodes?.length) {
            while (i < this.nodes.length) {
                if (this.nodes[i].type === "empty") { this.nodes.splice(i--, 1) }
                else { this.nodes[i].removeEmpty() }
                i++;
            }
        }
        return this;
    },
    toStringA(indent = "") {
        const nextIndent = ((this.indent && this.nodes?.[0].type === "newLine") ? indent + this.indent : indent)
        var str =  this.prefix + this.value, indentLast = false;
        debug && log("node: " + this.type + ":" + this.value )
        if (this.nodes && this.nodes.length) {
            for(const node of this.nodes) {
                str +=  (this.indent ? nextIndent : "") + node.toStringA(nextIndent);
            }
            if (this.nodes[this.nodes.length - 1].type === "newLine") { indentLast = true }
        }
        str += (indentLast ? indent : "") +(this.tail ?? "");
        return str;
    },
}
const nodeTypesCommon = {
    closingAction(parent, node, tokens) { },
    addNode(parent, nodes, node) {  nodes.push(node) },
    extendNode(parent, node) { return node },
    tokenizerStart(parent, node, tokens) {  return tokens.next().value },
    clean(parent, node, tokens) {
        if (node.nodes?.length === 0) { node.nodes = undefined }
        if (node.scope?.empty) { node.scope = undefined }
    },
}
const commonOpts = {
    terminate(parent, node, tokens) { tokenizer.results.tokenized[0] = "" },
    baseTypes: new Set(["newLine", "var", "const", "block", "expresion", "while", "if", "elseif", "else", "function", "return"]),
}
function nodeCreater(typeDefault) {
    return function node(parent, value, tokens) {
        const node = this.extendNode(parent, {
            ...nodeCommon,
            type: typeDefault ?? value,
            nodes: [],

        });
        var isOrdered = false;
        if (this.orderedTypes && node.orderedPos === undefined) {
            node.orderedPos = 0;
            isOrdered = true;

        }
        const closeNode = () => {
            this.closingAction(parent, node, tokens);
            this.clean(parent, node);
            indent = indent.slice(0, -2);
            debug && log(indent + node.text() +" Closed")
            return node;
        }
        try {

            var tokenized = this.tokenizerStart(parent, node, tokens);
            debug && log(indent + node.text() +" Open")
            var type, token, validTypes;
            indent += "  ";
            while (tokenized) {
                [type, token] = tokenized;

                if (this.typeTransform) {
                    const typeTransform = isOrdered ? this.typeTransform[node.orderedPos] : this.typeTransform;
                    type = typeTransform[type] ?? type;
                }
                if (this.closingTypes?.has(type)) { return closeNode() }
                if (isOrdered) {
                    validTypes = this.orderedTypes[node.orderedPos];
                    if (!validTypes.has(type)) {
                        if (this.orderedTypes[node.orderedPos + 1].has(type)) {
                            validTypes = this.orderedTypes[++node.orderedPos];
                        }
                    }
                } else { validTypes = this.validTypes }
                if (validTypes.has(type)) {
                    const newNode = nodeTypes[type].node(node, token, tokens);
                    this.addNode(parent, node.nodes, newNode);
                    if (this.closingTypes?.has(tokenizer.results.tokenized[0])) { return closeNode() }
                } else {
                    debug && log(indent + "Unknown: " + type)
                }
                tokenized = tokens.next().value;
            }
            indent = indent.slice(0, -2);
        } catch(e) {
            log("ERROR!!!! " + e.message);
            setTimeout(() => {log("ERROR!!!! " + e.message)}, 0);
            throw e;
        }
        return node;
    }
}
const nodeTypes = {
    [base]: (()=> ({
        ...nodeTypesCommon,
        validTypes: commonOpts.baseTypes,
        typeTransform: {identifier: "expresion"},
        closingAction(parent, node, tokens) { tokenizer.results.tokenized[0] = "" },
        extendNode(parent, node) { return {...node, tail: "\n", scope: scopes.addScope() } },
        node: nodeCreater("base"),
    }))(),
    block: (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: commonOpts.baseTypes,
        typeTransform: {
            identifier: "expresion",
            number: "expresion",
        },
        closingAction(parent, node, tokens) {
            if (parent.type === "block") { tokenizer.results.tokenized[0] = "" }
            scopes.closeScope(node.scope);
        },
        extendNode(parent, node) {
            const isFunc = parent.type === "function" ||
                            (parent.type === "defineProperty" && parent.nodes[1].type === "functionArgs");
            return {
                ...node,
                value: "{",
                tail: "}",
                scope: isFunc ? parent.scope : scopes.addScope(),
                indent: "  "
            };
        },
        node: nodeCreater("block"),
    }))(),
    "function":  (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["functionArgs", "block", "functionName"]),
        typeTransform: { group: "functionArgs", identifier: "functionName" },
        closingAction: commonOpts.terminate,
        extendNode(parent, node) {
            return {
                ...node,
                tail: "\n",
                scope: scopes.addScope(),
            }
        },
        node: nodeCreater("function"),
    }))(),
    "while": (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["group","block"]),
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "while"} },
        node: nodeCreater("while"),
    }))(),
    "if": (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["group","block"]),
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "if"} },
        node: nodeCreater("if"),
    }))(),
    "elseif": (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["group","block"]),
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "else if"} },
        node: nodeCreater("else if"),
    }))(),
    "else": (()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["block"]),
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "else"} },
        node: nodeCreater("else"),
    }))(),
    functionArgs:(()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeGroup"]),
        validTypes: new Set(["comma", "declaration","expresion", "group"]),
        typeTransform: { identifier: "declaration", assign: "expresion", group: "expresion" },
        closingAction: commonOpts.terminate,
        addNode(parent, nodes, node) {
            nodes.push(node);
            const val = node.value;
            if (node.type === "declaration") {
                if (parent.type !== "function") {
                    if (!parent.scope) { parent.scope = scopes.addScope() }
                }
                node.value = scopes.addName(val)
            }
        },
        extendNode(parent, node) { return {...node, value: "(", tail: ")" } },
        node: nodeCreater("functionArgs"),
    }))(),
    group:(()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeGroup"]),
        validTypes: new Set(["comma", "expresion", "group"]),
        typeTransform: {
            identifier: "expresion",
            number: "expresion",
            group: "expresion",
            bracket: "expresion",
            spread: "expresion",
        },
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "(", tail: ")" } },
        node: nodeCreater("group"),
    }))(),
    bracket:(()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBracket"]),
        validTypes: new Set(["comma", "expresion", "group"]),
        typeTransform: {
            identifier: "expresion",
            number: "expresion",
            group: "expresion",
            string: "expresion",
        },
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "[", tail: "]" } },
        node: nodeCreater("bracket"),
    }))(),
    object:(()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["closeBlock"]),
        validTypes: new Set(["defineProperty", "comma", "expresion", "bracket", "propertyAssign", "newLine"]),
        typeTransform: {
            identifier: "defineProperty",
            number: "expresion",
            string: "defineProperty",
            bracket: "defineProperty",
        },
        closingAction: commonOpts.terminate,
        extendNode(parent, node) { return {...node, value: "{", tail: "}", indent: "  "} },
        node: nodeCreater("object"),
    }))(),
    defineProperty:(()=> ({
        ...nodeTypesCommon,
        closingTypes: new Set(["comma"]),
        orderedTypes: [
            new Set(["identifier","string", "bracket", "expresion", "functionArgs", "block" ]),
            new Set(["colon" ]),
            new Set(["expresion", "object" ]),
        ],
        typeTransform: [{
                bracket: "expresion",
                group: "functionArgs",
            },{
                identifier: "expresion",
                number: "expresion",
                string: "expresion",
                bracket: "expresion",
                block: "object",
            },{
                identifier: "expresion",
                number: "expresion",
                string: "expresion",
                group: "expresion",
                bracket: "expresion",
                block: "object",
            },
        ],
        closingAction(parent, node, tokens) {
            if (node.nodes.length === 3) {
                if (node.nodes[1].type === "functionArgs") {
                    node.nodes[0].type = "functionName";
                }
            }
            if (node.nodes.length === 1) {
                if (node.nodes[0].type === "propertyDeclaration") {
                    const value = scopes.getName(node.nodes[0].value);
                    node.nodes[0].srcName = node.nodes[0].value;
                    node.nodes[0].value = value;
                }
            }
            if (tokenizer.results.tokenized[0] === "comma") {
                if (parent.type === "object") { tokenizer.results.action = tokenizer.results.keep }
            }
        },
        extendNode(parent, node) { return {...node } },
        tokenizerStart(parent, node, tokens) {
            tokenizer.results.action = tokenizer.results.keep;
            const tokenized = tokens.next().value;
            var [type, token] = tokenized;
            if (this.orderedTypes[node.orderedPos].has(type)) {
                const newNode = nodeTypes[type].node(node, token, tokens);
                this.addNode(parent, node.nodes, newNode);
            }
            return tokens.next().value;
        },
        node: nodeCreater("defineProperty"),
    }))(),
    expresion: (() => ({
        ...nodeTypesCommon,
        closingTypes: new Set(["comma", "newLine", "closeGroup", "closeBlock",  "closeBracket"]),
        validTypes: new Set([
            "expresion", "assign", "operator", "ternary", "ternaryColon", "logic",
            "identifier", "number", "group", "bracket", "spread",
            "arrow", "string", "object",
        ]),
        typeTransform: {
            identifier: "expresion",
            number: "expresion",
            string: "expresion",
            group: "expresion",
            bracket: "expresion",
            block: "object",
        },
        closingAction(parent, node, tokens) {
            if (tokenizer.results.tokenized[0] === "newLine") {
                tokenizer.results.action = tokenizer.results.keep;

            } else if (tokenizer.results.tokenized[0] === "comma") {
                if (parent.type === "bracket" ||
                    parent.type === "group" ||
                    parent.type === "functionArgs" ||
                    parent.type === "var" ||
                    parent.type === "defineProperty"
                    ) {
                    tokenizer.results.action = tokenizer.results.keep;
                }
            }
        },
        tokenizerStart(parent, node, tokens) {
            tokenizer.results.action = tokenizer.results.keep;
            const tokenized = tokens.next().value;
            var [type, token] = tokenized;
            if (this.validTypes.has(type)) {
                const newNode = nodeTypes[type].node(node, token, tokens);
                this.addNode(parent, node.nodes, newNode);
            }
            return tokens.next().value;
        },
        node: nodeCreater("expresion"),
    }))(),
    functionName: {
        node(parent, value) {
            const scope = parent.scope;
            scopes.closeScope(scope);
            const newVal = scopes.addName(value);
            scopes.openScope(scope);
            return {
                ...nodeCommon,
                type: "functionName",
                value: newVal,
                srcName: value,
                prefix: "function "
            };
        },
    },
    identifier: {
        node(parent, value) {
            if (parent.type === "defineProperty" && parent.nodes.length === 0) {
                return { ...nodeCommon, type: "propertyDeclaration", value };
            }
            const scope = parent.scope;
            if (value.includes(".")) {
                const properties = value.split(".").reverse();
                return {
                    ...nodeCommon,
                    type: "identifier",
                    value: scopes.getName(properties.pop()),
                    nodes: properties.reverse().map(value => nodeTypes.property.node(null, value)),
                };
            }
            return { ...nodeCommon, type: "identifier", value: scopes.getName(value), srcName: value};
        },
    },
    const: (() => ({
        ...nodeTypesCommon,
        closingTypes: new Set(["newLine"]),
        validTypes: new Set(["comma", "declaration", "expresion"]),
        typeTransform: { identifier: "declaration", assign: "expresion" },
        addNode(parent, nodes, node) {
            const val = node.value;
            nodes.push(node);
            if (node.type === "declaration") { node.value = scopes.addName(val) }
        },
        extendNode(parent, node) { return {...node, "const": true, value: "const "  } },
        node: nodeCreater(),

    }))(),
    var: (() => ({
        ...nodeTypesCommon,
        closingTypes: new Set(["newLine"]),
        validTypes: new Set(["comma", "declaration", "expresion"]),
        typeTransform: { identifier: "declaration", assign: "expresion" },
        addNode(parent, nodes, node) {
            const val = node.value;
            nodes.push(node);
            if (node.type === "declaration") { node.value = scopes.addName(val) }
        },
        extendNode(parent, node) { return {...node, value: "var ", "var": true } },
        node: nodeCreater(),

    }))(),
    arrow: (() => ({
        ...nodeTypesCommon,
        closingTypes: new Set(["newLine"]),
        validTypes: new Set(["block", "group", "expresion"]),
        typeTransform: {
            identifier: "expresion",
            number: "expresion",
        },
        addNode(parent, nodes, node) { nodes.push(node) },
        extendNode(parent, node) { return {...node, value: "=>" } },
        node: nodeCreater("arrow"),

    }))(),
    string: {
        node(parent, value) {
            return {
                ...nodeCommon,
                type: "string",
                value: strings.get(Number(value.replace("###S", "").replace("###", ""))),
            };
        },
    },
    return: { node(parent, value) {       return { ...nodeCommon, type: "return",       value: "return "} } },
    spread: { node(parent, value) {       return { ...nodeCommon, type: "spread",       value: "..."} } },
    assign: { node(parent, value) {       return { ...nodeCommon, type: "assign",       value, prefix: " ", tail: " "} } },
    operator: { node(parent, value) {     return { ...nodeCommon, type: "operator",     value, prefix: " ", tail: " "} } },
    logic: { node(parent, value) {        return { ...nodeCommon, type: "logic",        value, prefix: " ", tail: " "} } },
    ternary: { node(parent, value) {      return { ...nodeCommon, type: "ternary",      value, tail: " "} } },
    colon: { node(parent, value) {        return { ...nodeCommon, type: "colon",        value: ":", tail: " "} } },
    propertyAssign: { node(parent, value){return { ...nodeCommon, type: "propertyAssign", value: ":", tail: " "} } },
    declaration: { node(parent, value) {  return { ...nodeCommon, type: "declaration",  value, srcName: value} } },
    closeGroup: { node(parent, value) {   return { ...nodeCommon, type: "closeGroup",   value: ")"} } },
    closeBlock: { node(parent, value) {   return { ...nodeCommon, type: "closeBlock",   value: "}"} } },
    closeBracket: { node(parent, value) { return { ...nodeCommon, type: "closeBracket", value: "]"} } },
    number: { node(parent, value) {       return { ...nodeCommon, type: "number",       value} } },
    property: { node(parent, value) {     return { ...nodeCommon, type: "property",     value: "." + value} },},
    comma: { node(parent, value) {        return { ...nodeCommon, type: "comma",        value: ",", tail: " "} },},
    newLine: { node(parent, value) {      return { ...nodeCommon, type: "newLine",      value: "\n"} },},
    empty: { node(parent, value) {        return { ...nodeCommon, type: "empty", nodes: undefined } },},
}
const convertNodes = {
    declaration(parent, node, idx) {
        const nextNode = parent.nodes[idx + 1];
        if (nextNode?.type === "expresion") {
            if (nextNode.nodes[0]?.type === "assign" && nextNode.nodes.length === 2) {
                cleanNode(undefined, nextNode);
                node.nodes = nextNode.nodes;
                debug && log("declaration with assignment removed redundent expression node: ")
                parent.nodes[idx + 1] = nodeTypes.empty.node();
            }
        }
        return node;
    },
    identifier(parent, node, idx) { return node },
    return(parent, node, idx) {
        const nextNode = parent.nodes[idx + 1];
        if (nextNode?.type === "expresion" || nextNode?.type === "identifier") {
            debug && log("return node linked to returned node: ")
            node.nodes = [nextNode];
            node.nodes[0] = convertNodes[nextNode.type]?.(node, nextNode, 0) ?? node.nodes[0];
            parent.nodes[idx + 1] = nodeTypes.empty.node();
        }
        return node;
    },
    expresion(parent, node, idx) {
        if (node.nodes.length === 1) {
            const nextN = node.nodes[0];
            debug && log("Collapsed redundent expression: ")
            return nextN;
        }
        if (node.nodes.length === 2) {
            const nodeA = node.nodes[0];
            const nodeB = node.nodes[1];
            if (nodeA?.type === "identifier" && nodeB?.type === "group") {
                debug && log("expression to identifier: ")
                nodeA.nodes = nodeA.nodes ?? [];
                nodeA.nodes.push(nodeB);
                nodeB.type = "call";
                node.nodes[1] = nodeTypes.empty.node();
                return nodeA;
            }
        }
        return node;
    }
}
function cleanNode(parent, node) {
    var idx = 0;
    if (node.nodes) {
        for (const n of node.nodes) {
            cleanNode(node, n);
            node.nodes[idx] = convertNodes[n.type]?.(node, n, idx) ?? n;
            idx++;
        }
    }
    return node;
}
function nodeQueryAll(node, query) {
    const res = [];
    var i = 0;
    while (i < (node.nodes?.length ?? 0)) {
        if (node.nodes[i].type === query) {
            res.push({
                parent: node,
                node: node.nodes[i]
            });
        }
        res.push(...nodeQueryAll(node.nodes[i++], query));
    }

    return res;
}

function parser(lines) {
    const tokens = tokenizer(lines);
    return nodeTypes[base].node(undefined, "base", tokens);
}

log(allLines)
const AST = parser(allLines);
cleanNode(undefined, AST).removeEmpty();





log.obj(AST, false, 60);
log.obj(nodeQueryAll(AST, "function"), false, 20);
log(AST.toStringA())
