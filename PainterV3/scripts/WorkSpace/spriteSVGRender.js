"use strict";
const spriteSVGRender = (()=>{  // NOT FOR REALTIME RENDERING
    const id = UID ++;
    var c,v,im, iScale = 1;
    var inGroup = false;
    var m = [1,0,0,1,0,0];
    var gAlpha = 1;
    var animationTypes = ["No animation","Use keyframes","Flatten keys"];
    var currentAnimType = 0;
    const shapes = new Set();
    const texts = new Set();

    var includeIds = false;
    const wp1 = utils.point;
    const wp2 = utils.point;
    const wp3 = utils.point;
    const wp4 = utils.point;
    const w1 = utils.point;
    const viewBox = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        m: [1,0,0,1,0,0],
        im: [1,0,0,1,0,0],
        applyView(m) {
            m[0] = this.m[0];
            m[1] = this.m[1];
            m[2] = this.m[2];
            m[3] = this.m[3];
            m[4] = this.m[4];
            m[5] = this.m[5];

        },
        update() {
            const spr = this.spr;
            viewBox.w = spr.w;
            viewBox.h = spr.h;
            viewBox.offsetX = spr.x;
            viewBox.offsetY = spr.y;

            viewBox.rot = Math.atan2(spr.key.im[1], spr.key.im[0]);
            viewBox.scale = 1;//Math.min(ctx.canvas.width / (wig.w * wig.sx), ctx.canvas.height / (wig.h * wig.sy));
            viewBox.x =  (spr.w * spr.sx / 2) - (spr.x * Math.cos(viewBox.rot) * viewBox.scale - spr.y * Math.sin(viewBox.rot) * viewBox.scale);
            viewBox.y =  (spr.h * spr.sy / 2) - (spr.x * Math.sin(viewBox.rot) * viewBox.scale + spr.y * Math.cos(viewBox.rot) * viewBox.scale);
            const xdx = Math.cos(viewBox.rot) * viewBox.scale;
            const xdy = Math.sin(viewBox.rot) * viewBox.scale;
            viewBox.m[3] = viewBox.m[0] = xdx;
            viewBox.m[2] = -(viewBox.m[1] = xdy);
            viewBox.m[4] = viewBox.x;
            viewBox.m[5] = viewBox.y;
            const cross = xdx * xdx + xdy * xdy;
            viewBox.im[3] = viewBox.im[0] = xdx / cross;
            viewBox.im[1] = -(viewBox.im[2] = xdy / cross);

        },
        toString() { return numToStr(0) + " " + numToStr(0) + " " + numToStr(this.w) + " " + numToStr(this.h); },

    };
    function numToStr(num, dig) {
        if (dig !== undefined) { return num.toFixed(dig).replace(new RegExp("(\\.0{"+dig+"}|0{1,"+dig+"})$","g"), "") }
        return num.toFixed(SVGDig).replace(SVGForNum, "");
    }
    const pathVContext = {
        paths: [],
        pathStrs: [],
        currentPath: undefined,
        matrix: [1,0,0,1,0,0],
        setTransform(a,b,c,d,e,f) {
            this.matrix[0] = a;
            this.matrix[1] = b;
            this.matrix[2] = c;
            this.matrix[3] = d;
            this.matrix[4] = e;
            this.matrix[5] = f;
        },
        transform(a,b,c,d,e,f) {
            const m = this.matrix;
            this.setTransform(
                m[0] * a + m[2] * b,
                m[1] * a + m[3] * b,
                m[0] * c + m[2] * d,
                m[1] * c + m[3] * d,
                m[0] * e + m[2] * f + m[4],
                m[1] * e + m[3] * f + m[5]
            );
        },
        getPoint(x, y, w = wp2) {
            const m = this.matrix;
            w.x = x * m[0] + y * m[2] + m[4];
            w.y = x * m[1] + y * m[3] + m[5];
            return w;
        },
        reset() {
            this.paths.length = 0;
            this.currentPath = undefined;
            this.matrix.length = 0;
            this.matrix.push(1,0,0,1,0,0);
        },
        beginPath(spr) {
            this.spr = spr;
            this.paths.push(this.currentPath = []);
        },
        closePath() { this.currentPath.push("z") },
        fill(spr) {
            this.stroke()
        },
        stroke(spr) {
            var s, str = "";
            this.pathStrs.length = 0;
            for (const p of this.paths) {
                str = "";
                s = "";
                for (const v of p) {
                    if (isNaN(v)) {
                        str += v;
                        s = "";
                    } else {
                        str += s + numToStr(v)
                        s = " "
                    }
                }
                this.pathStrs.push(str);
            }
        },
        moveTo(x, y) {
            this.getPoint(x, y)
            this.currentPath.push("M", wp2.x, wp2.y);
        },
        lineTo(x, y) {
            this.getPoint(x, y)
            this.currentPath.push((this.currentPath.length ? "L" : "M"), wp2.x, wp2.y);
        },
        rect(x, y, w, h) {
            this.moveTo(x, y);
            this.lineTo(x + w, y);
            this.lineTo(x + w, y + h);
            this.lineTo(x, y + h);
            this.closePath();
        },
        arc(x, y, r, start, end, dir) {
            const sx = x + Math.cos(start) * r;
            const sy = y + Math.sin(start) * r;
            this.lineTo(sx, sy);
            const ex = x + Math.cos(end) * r;
            const ey = y + Math.sin(end) * r;
            this.getPoint(ex, ey);
            this.currentPath.push("A", r, r, 0, 0, (dir !== true ? 1 : 0), wp2.x, wp2.y);
        },
        ellipse(x,  y, radW, radH, dir, start, end, sweepDir) {
            var [sx, sy] = Math.polarEllipse2d(start, radW, radH, dir);
            this.lineTo(sx + x, sy + y);
            var [ex, ey] = Math.polarEllipse2d(end, radW, radH, dir);
            this.getPoint(ex + x, ey + y);
            this.currentPath.push("A", radW, radH, dir,  0, (sweepDir !== true ? 1 : 0), wp2.x, wp2.y);
        },
    }
    const svgIds = {
        id: 1,
        default: "id",
        named: new Set(),
        getNewId(name) {
            if (name === "" || name === undefined) {
                name = this.default + this.id++;
                this.named.add(name);
                return name;
            }
            if (this.named.has(name)) {
                let newName = name + "_" + this.id++;
                while (this.named.has(newName)) { newName = name + "_" + this.id++ }
                this.named.add(newName);
                return newName;
            }
            this.named.add(name);
            return name;
        },
        reset() {
            this.id = 1;
            this.named.clear();
        }
    };
    const nodeCommon = {
        setMatrix(m) {
            const mm = m.map(v => numToStr(v, 7));
            this.attributes.transform = "matrix(" + mm.join(" ") + ")";
        }
    }
    const nodeTypes = {
        svg: {
            outer: `<?xml version="1.0" encoding="iso-8859-1"?><!-- Generator: ${APPNAME} (V ${VERSION+SUB_VERSION}), SVG Export Batch V B0.1  -->${"\n<!-- Author: " + settings.author + "-->\n" + "<!-- Copyright: " + settings.copyright + "-->\n" + "<!-- Project: " + settings.project + "-->"}\n`,
            attributes: {
                viewBox,
                xmlns: "http://www.w3.org/2000/svg",
                "xmlns:xlink": "http://www.w3.org/1999/xlink",
            },
            canHaveID: false,
        },
        style: {  // only one instance for now
            id: 1,
            canHaveID: false,
            selectors: new Map(),
            addSelector(desc, selName) {  // if given selName may be overwriten if style exists. Will return used selName
                var s;
                if (this.selectors.has(desc.toString())) {
                    s = this.selectors.get(desc.toString());
                    return s.name[0] === "." ? s.name.slice(1) : s.name;
                }
                selName = selName ? selName : ".C_" + (this.id++);
                this.selectors.set(desc.toString(), s = {name: selName, str: "{" + desc.toString() + ";}" });
                return selName[0] === "." ? selName.slice(1) : selName;
            },
            inner(indent) {
                var str = "";
                for(const s of this.selectors.values()) { str += indent + s.name + " " + s.str + "\n" }
                return str;
            },
            reset() { this.selectors.clear(); this.id = 1; },
        },
        text: {
            attributes: {
                x: 0,
                y: 0,
                //textLength: 0,
                fill: "##RGBA##",
                opacity: "##ALPHA##",
                "dominant-baseline": "middle",
                "text-anchor": "middle",
            },
            init(node) {
                const desc = "font: " + (node.spr.textInfo.size).toFixed(1) + "px" + " " + node.spr.textInfo.font;
                var n = node.parent;
                while (n.parent) { n = n.parent }
                node.attributes["class"] = n.style.desc.addSelector(desc);
            },
            useCommon: true,
            content: "",
            update(spr) {
                const mat = spr.key.m;
                pathVContext.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
                pathVContext.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);
                this.setMatrix(pathVContext.matrix);
                this.attributes.x = numToStr(0);
                this.attributes.y = numToStr(0);
                this.content = spr.textInfo.text;
            },
        },
        path: {
            attributes: {opacity: "##ALPHA##"},
            update(spr) {
                const mat = spr.key.m;
                pathVContext.reset();
                pathVContext.setTransform(m[0],m[1],m[2],m[3],m[4],m[5]);
                pathVContext.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);


                pathVContext.beginPath(spr);
                if (spr.type.vector) {
                    createVectorPath(spr, pathVContext, this.attributes);
                } else if (spr.shape.SVG) {
                    spr.shape.SVG(spr, pathVContext, this.attributes);
                }
                pathVContext.fill();
                this.attributes.d = pathVContext.pathStrs.join(" ");
            },
        },
        g: {
            attributes: {
                opacity: "##ALPHA##",
            },
            useCommon: true,
            update(spr) {
                if (spr.type.group) {
                    this.viewBoxSpr = viewBox.spr;
                    viewBox.spr = spr;
                    viewBox.update();

                }
            },
            exit() {
                if (this.viewBoxSpr) {
                    viewBox.spr = this.viewBoxSpr;
                    viewBox.update();
                }
            },
        },
        use: {
            attributes: {
                opacity: "##ALPHA##",
                transform: "matrix(1 0 0 1 0 0)",
                href: "",
            },
            useCommon: true,
            update(spr) {
            },
        },
        defs: {
            attributes: {},
            canHaveID: false,
        },

        animate: {
            attributes: {
                attributeName: "",
                dur: "",
                repeatCount: "indefinite",
            },
            canHaveID: false,
            defineTrack(node, name, attName, start, end) {
                node.isAnim = true;
                return {name, attName, start, end, dur: (end - start + 1) / 60, vals: []}
            },
            update(spr) {
                const atts = this.attributes;
                atts.dur = this.track.dur +"s";
                atts.attributeName = this.track.attName;
                atts.values = this.track.vals.join(";");
            },
        }
    };
    function SVGNode(type, parent, spr, attributes = {}) {
        this.type = type;
        this.parent = parent;
        this.spr = spr;
        this.children = [];
        this.isSVGNode = true;
        if (nodeTypes[type]) {
            const t = nodeTypes[type];
            this.desc = t;
            t.reset && t.reset();
            t.update && (this.update = t.update);
            t.exit && (this.exit = t.exit);
            t.useCommon &&  Object.assign(this, nodeCommon);
            this.attributes = Object.assign(attributes, t.attributes);
            t.init && t.init(this);
        } else {
            this.attributes = {...attributes};
        }
        if (includeIds) {
            if (this.attributes.id === undefined) {
                this.setId(spr ? spr.name : "");
            }
        }
    }
    SVGNode.prototype = {
        addNode(node) { this.children.push(node); return node },
        setId(id){
            if (this.desc && this.desc.canHaveID !== false) {
                this.attributes.id = svgIds.getNewId(id);
            }
        },
        cleanAttributeString(str) {
            if (this.spr) {
                const vb = viewBox.spr, spr = this.spr;
                str = str.replace(/##RGBA##/g, spr.rgb.css);
                if (this.type.animated) {
                    str = str.replace(/##X##|##Y##/g, "0");
                } else {
                    vb.key.toLocalP(spr.x - spr.cx * vb.sx, spr.y - spr.cy * vb.sy, wp2);
                    vb.key.toLocalP(spr.x, spr.y, wp1);
                    str = str.replace(/##ALPHA##/g, numToStr(spr.a * gAlpha, 3))
                        .replace(/##MAXWHW##/g, numToStr(Math.min(spr.w * vb.sx, spr.h * vb.sy)));
                }
            }
            return str;
        },
        toString(indent = "") {
            if(this.update) { this.update(this.spr) }
            var str = indent + (this.desc && this.desc.outer ? this.desc.outer.replace(/\n/g, "\n"+indent) :"")+"<" + this.type;
            if (this.attributes.id) { str += " id=\"" + this.attributes.id +"\"" } // force id as first attribute for reading
            for (const [name, val]  of Object.entries(this.attributes)) {
                if (name !=="id" && val !== "" && val !== undefined) { str += " " + name + "=\"" + val +"\""}
            }
            str = this.cleanAttributeString(str);
            const hasContent = this.content !== undefined && this.content !== "";
            if (this.desc.inner) {
                str += ">\n";
                str += this.desc.inner(indent + SVGIndent);
                str += indent+ "</" + this.type + ">\n";
            } else {
                if (this.children.length) {
                    str += ">\n";
                    str += hasContent ? this.desc.content : ""
                    for (const n of this.children) { str += n.toString(indent + SVGIndent) }
                    str += indent+ "</" + this.type + ">\n";
                } else if (hasContent) {
                    str += ">" + this.content + "</" + this.type + ">\n";
                } else {
                    str += "/>\n";
                }
            }
            if(this.exit) { this.exit(this.spr) }
            return str;
        },
        each(cb) {
            if (this.children.length) {
                for (const n of this.children) {
                    cb(n);
                    n.each(cb)
                }
            }
        },
        getChildrenByType(type) {
            const nodes = [];
            if (this.children.length) {
                for (const n of this.children) {
                    if (n.type === type) {
                        nodes.push(n);
                    }
                    nodes.push(...n.getChildrenByType(type));
                }
            }
            return nodes;
        },
    }
    function createSVGAndSave(name = "testSVG") {
        const svg = new SVGNode("svg");
        svg.style = svg.addNode(new SVGNode("style"));
        svg.style.desc.addSelector("stroke-linecap:round;stroke-linejoin:round;fill:none", ".stroke");
        svg.style.desc.addSelector("fill-rule:evenodd;stroke:none", ".fill");
        svg.style.desc.addSelector("lengthAdjust:spacingAndGlyphs", "text");
        if (API.includeAnimation) {
            svg.style.desc.addSelector("shape-rendering:optimizeSpeed;text-rendering:optimizeSpeed", ".fast");
        }
        svg.name = name;
        API.createGroups(svg);
        if (API.render(svg)) {  // if true has anim
            API.stepAnim(svg);
        } else  {
            download(svg);
        }
    }
    function download(svg) {
        viewBox.update();
        viewBox.applyView(m);
        downloadTextAs(svg.toString(), svg.name + "_" + viewBox.spr.guid, "SVG");
        log("Downloading Exported SVG");
    }
    var samplingAnimation = false;
    var nextTimeSample = 0;
    var rootNode, startTime, endTime, frames;
    function startAnimCap() {
        samplingAnimation = true;
        frames = endTime - startTime + 1;
        animation.addEvent("change", animTimeChanged);
    }
    function endAnimCap() {
        samplingAnimation = false;
        animation.removeEvent("change", animTimeChanged);
        //animation.removeEvent("befortimechange", beforTimeChange);
        download(rootNode);
        rootNode = undefined;
    }
    function animTimeChanged() {
        if(animation.time === nextTimeSample) { sampleFrame() }
    }
    function time(t) {
        if (animation.time === t) {
            nextTimeSample = t;
            animTimeChanged();
        } else {
            nextTimeSample = t;
            animation.time = t;
        }
    }
    function sampleFrame(){
        rootNode.each(node => {
            if(node.isAnim) {
                const t = node.track;
                const tn = t.name;
                const spr = node.spr;
                t.vals.push(numToStr(spr[tn]));
            }
        });
        nextTimeSample += 1;
        if (nextTimeSample > endTime) {
            endAnimCap();
        } else {
            time(nextTimeSample);
        }
    }
    const API = {
        get viewBox() { return viewBox.spr },
        setViewBox(spr){
            if (samplingAnimation ) {
                log.warn("SVG export is busy! Can not set viewBox");
                return;
            }
            if (viewBox.spr) {
                viewBox.spr.removeEvent("onchange", viewBox.update);
            }
            if (spr === undefined) {
                viewBox.spr = undefined;
                return;
            }
            viewBox.spr = spr;
            spr.addEvent("onchange", viewBox.update);
            viewBox.update();
        },
        get includeIds() { return includeIds },
        set includeIds(state) {
            includeIds = state === true;
        },
        export(name) {
            if (samplingAnimation ) {
                log.warn("SVG export is busy!");
                return;
            }
            createSVGAndSave(name)
        },
        get animationType() { return animationTypes[currentAnimType] },
        set animationType(val) {
            currentAnimType = animationTypes.indexOf(val);
            currentAnimType = currentAnimType < 0 ? 0 : currentAnimType;
            API.includeAnimation = currentAnimType > 0;
        },
        includeAnimation: false,
        stepAnim(svg) {
            rootNode = svg;
            rootNode.each(node => {
                if(node.tracks && node.spr) {
                    if (node.attributes.class !== undefined) {
                        if (!node.attributes.class.includes("fast")) {
                            node.attributes.class += " fast";
                        }
                    } else {
                        node.attributes.class = "fast";
                    }
                }
            });
            if(2 === currentAnimType) {
                startAnimCap()
                time(animation.startTime);
            } else if (1 === currentAnimType) {
                log.warn("SLOW PROGRAMER WARNING. Key frame animation export is not ready yet!");
            }
        },
        getDefsNode(svg) {
            const d = svg.getChildrenByType("defs");
            if (d.length === 0) {
                const defs = new SVGNode("defs", svg);
                svg.addNode(defs);
                return defs;
            }
            return d[0];
        },
        createGroups(svg) {
            const defs = API.getDefsNode(svg);
            groups.each(grp => {
                const g = new SVGNode("g", defs, grp.group.owner);
                g.setId("G"+grp.group.guid);
                defs.addNode(g);
                API.render(g, grp.group.sprites);
            });
        },
        createShapes(svg) {
            const defs = API.getDefsNode(svg);
            shapes.clear();
            sprites.each(spr => {
                if (spr.type.shape && (spr.shape.name === "vector" || spr.shape.name === "vectorCommited")) {
                    if (!shapes.has(spr.shape)) {
                        shapes.add(spr.shape);
                    }
                }
            });
            for(const s of shapes.values()) {
                const g = new SVGNode("g", defs);
                g.setId("S"+s.id);
                defs.addNode(g);
                API.render(g, s);
            }
        },
        render(svg, sprList = selection) {
            var i = 0;
            startTime = animation.startTime;
            endTime = animation.endTime;
            var hasAnimated = false
            for (i = 0; i < sprList.length; i ++) {
                const spr = sprList[i];
                if (!spr.type.hidden) {
                    if (spr.type.group) {
                        const ga =  gAlpha;
                        gAlpha = spr.a * gAlpha;
                        if(gAlpha > 0.001){
                            const currentInGroup = inGroup;
                            inGroup = true;
                            const mm = m;
                            m = spr.group.matrix;
                            viewBox.getPoint(0, 0, spr, wp1);
                            const ms = [spr.key.m[0],spr.key.m[1],spr.key.m[2],spr.key.m[3],wp1.x, wp1.y];
                            m[0] = mm[0] * ms[0] + mm[2] * ms[1];
                            m[1] = mm[1] * ms[0] + mm[3] * ms[1];
                            m[2] = mm[0] * ms[2] + mm[2] * ms[3];
                            m[3] = mm[1] * ms[2] + mm[3] * ms[3];
                            m[4] = mm[0] * ms[4] + mm[2] * ms[5] + mm[4];
                            m[5] = mm[1] * ms[4] + mm[3] * ms[5] + mm[5];
                            const u = new SVGNode("use", svg, spr);
                            u.setMatrix(m);
                            u.attributes.href = "#G"+spr.group.guid;
                            svg.addNode(u);
                            //API.render(g, spr.group.sprites);
                            m = mm;
                            inGroup = currentInGroup;
                        }
                        gAlpha = ga;
                    } else if (spr.type.text || spr.type.shape || spr.type.vector) {
                        if (spr.type.text) {
                            const n = new SVGNode("text", svg, spr);
                            svg.addNode(n);
                        } else if (spr.type.vector) {
                            const n = new SVGNode("path", svg, spr);
                            svg.addNode(n);
                        } else if (spr.type.shape) {
                            if (spr.shape.SVGType) {
                                const n = new SVGNode(spr.shape.SVGType.name, svg, spr, {...spr.shape.SVGType.atts});
                                svg.addNode(n);
                                if (API.includeAnimation && spr.type.animated) {
                                    hasAnimated = true;
                                    n.tracks = {};
                                    spr.animation.eachTrack(track => {
                                        const at = new SVGNode("animate", n, spr);
                                        n.addNode(at);
                                        at.track = at.desc.defineTrack(at, track.name, track.name, startTime, endTime);
                                        n.tracks[track.name] = at;
                                    });
                                }
                            }
                        }
                    }
                }
            }
            return API.includeAnimation && hasAnimated;
        },
    }
    return API;
})();