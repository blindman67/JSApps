const HTMLAnimationExport = (()=> {
    const aSprites = [];
    var classId = 1;
    var exportId;
    var viewSpr;
    var styleStr = "";
    const idList = new Map();
    var frameStep = 1;
    var timeScale = 1;
    var timingFunction = "linear";
    //var recurseList = new Set();
    //const shapesById = new Map();
    var samplingAnimation = false;
    var nextTimeSample = 0;
    var startTime, endTime, frames;
    var onFrame, onEnd, onStart, onAnimCaptureComplete;
    var commonStyles = new Map();
    const outputSize = {w: 1024, h: 1024}
    var animationType = "CSS";
    var animationTypeJavaScript = false;
    const spriteSheets = new Map();
    function javaScriptScript() {
        "####SCRIPT####";
        const regs=[,/(\.0{1}|0{1,1})$/g,/(\.0{2}|0{1,2})$/g,/(\.0{3}|0{1,3})$/g,/(\.0{4}|0{1,4})$/g,/(\.0{5}|0{1,5})$/g,/(\.0{6}|0{1,6})$/g,/(\.0{7}|0{1,7})$/g,/(\.0{8}|0{1,8})$/g], LIM="}\n";
        const nS=(n,d)=>n.toFixed(d).replace(regs[d], ""), nH=(n)=>n.toString(16).padStart(2,"0"),b=()=>B[r++];
        const Sa=new Uint16Array(1),La=new Uint32Array(1),Fa=new Float32Array(1),S=new Uint8Array(Sa.buffer),L=new Uint8Array(La.buffer),F=new Uint8Array(Fa.buffer);
        const CT = ["color","fill","stroke"];
        var tracks=0,str="",r=0,t=[],end=false,ct=0;
        const P = {
            ALPHA:1,COLOR:2,MATRIX:4,
            get A(){return "opacity: "+(P.B/255).toFixed(3)+";"},
            get C(){return CT[ct]+": #"+nH(P.B)+nH(P.B)+nH(P.B)+";"},
            get M(){return "transform:matrix("+nS(P.F,8)+","+nS(P.F,8)+","+nS(P.F,8)+","+nS(P.F,8)+","+nS(P.F,2)+","+nS(P.F,2)+");"},
            p: {
                [1](){tracks=P.L;frames=P.L},
                [2](){
                    const tf = P.B,A = (tf & P.ALPHA) !== 0, C = (tf & P.COLOR) !== 0, M = (tf & P.MATRIX) !== 0;
                    var str = ["@keyframes T_" + P.L + " {"],i = 0;
                    while (i < frames) {
                        const t = P.L;
                        str.push(" "+nS((t & 0x3FFFFFFF)*100/(frames-1),6)+"% {");
                        ct=(t>>30)&0b11;
                        A && str.push(P.A);
                        C && str.push(P.C);
                        M && str.push(P.M);
                        str.push(LIM);
                        i ++;
                    }
                    str.push(LIM);
                    t.push(str);
                },
                [3](){var len=P.S,t="";while(len-->0){t+=String.fromCharCode(P.B)}console.log(t)},
                [4](){end=true},
            },
            get B(){return b()},
            get S(){S[0]=b();S[1]=b();return Sa[0]},
            get L(){L[0]=b();L[1]=b();L[2]=b();L[3]=b(); return La[0]},
            get F(){F[0]=b();F[1]=b();F[2]=b();F[3]=b(); return Fa[0]},
            read(){while(!end){P.p[P.B]()} return t},
        };
        const B = (()=>{
            const R=()=>(c=d.charCodeAt(i++),(c>=65&&c<=90?c-65:(c>=97&&c<=122?c-71:(c>=48&&c<=57?c+4:c===43?62:63))));
            const W=(A,B,C)=>{f[j++]=A;f[j++]=B;f[j++]=C};
            var i=0,l=d.length,j=0,c;
            const f=new Uint8Array(l*(3/4)|0);
            while(i<l){const a=R()<<2,b=R(),c=R();W(a+(b>>4),(b<<4)+(c>>2),(c<<6)+R())}
            return f;
        })();
        P.read().forEach(track=>{str+=track.join("")});
        document.querySelector("#"+AnimStyleId).innerHTML+=str;
        setTimeout(()=>{
            document.querySelector("#"+viewId).classList.remove("paused");
            document.body.removeChild(document.querySelector("#DECODER"));
        },20);
        "####SCRIPT####";
    }
    const SCRIPT = javaScriptScript.toString().replace(/\r\n        /g,"\r\n").split("\"####SCRIPT####\";\r\n")[1].split("\r\n");
    const PACKETS = { // B unsigned char, S unsigned int16, L unsigned in32, F float 32
        HEAD: 1, // B 1, L tracks, L frames
        TRACK: 2, // B 2, B [alpha,color,matrix bits], L trackId, [ L frameNum (bits 31, 30 define color property to set (0b00 color, 0b01 fill, 0b10 stroke, 0b11 reserved), [B alpha and or  [B,B,B RGB] and or [F,F,F,F,F,F matrix]]
        TEXT: 3, // B 3, S length, B [characters]
        EOS: 4, // B 4  No data is read after this packet
        ALPHA: 1,
        COLOR: 2,
        MATRIX: 4,
        writeHead(stream) {
            stream.writeByte(PACKETS.HEAD);
            stream.writeLong(aSprites.length-1);
            stream.writeLong(frames);
        },
        openTrack(stream, trackID, useA, useRGB, useMatrix) {
            stream.writeByte(PACKETS.TRACK);
            stream.writeByte((useA ? PACKETS.ALPHA : 0) + (useRGB ? PACKETS.COLOR : 0) + (useMatrix ? PACKETS.MATRIX : 0));
            stream.writeLong(trackID);
        },
        writeText(stream, text) {
            stream.writeByte(PACKETS.TEXT);
            stream.writeShort(text.length);
            var i = 0;
            while (i < text.length) { stream.writeByte(text.charCodeAt(i++) & 0xFF) }
        },
        writeEOS(stream) {
            stream.writeBytes(PACKETS.EOS, 0, 0, 0);
        },
    }
    const wp1 = utils.point;
    const wp2 = utils.point;
    const wp3 = utils.point;
    const MAT_SR_PREC = 8;
    const MAT_P_PREC = 2;
    const MAT_SR_PREC_S = 10 ** MAT_SR_PREC;
    const MAT_P_PREC_S = 10 ** MAT_P_PREC;
    const DATA_SIZE = 1024 * 3; // Important Must be a multiple of 3
    function DataBuffer(bufferSize) {
        const dataBuf = new ArrayBuffer(bufferSize);
        const uI8 = new Uint8Array(dataBuf);
        const uI16 = new Uint16Array(1);
        const uI16D8 = new Uint8Array(uI16.buffer);
        const uI32   = new Uint32Array(1);
        const uI32D8 = new Uint8Array(uI32.buffer);
        const i32    = new Int32Array(1);
        const i32D8  = new Uint8Array(i32.buffer);
        const f32    = new Float32Array(1);
        const f32D8  = new Uint8Array(f32.buffer);
        const f64    = new Float64Array(1);
        const f64D8  = new Uint8Array(f64.buffer);
        const encode = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var head = 0, tail = 0, size = 0;
        var store = "";
        const API = {
            clear() { tail = head = size = 0; store = "" },
            get store() { return store },
            flush(empty = false) {
                var idx = 0, a, b, c, b1, b2, b3, b4;
                if (size < 3 && !empty) { return "" }
                const str = [];
                if (empty) {
                    size % 3 === 2 && API.writeBytes(0, 0);
                    size % 3 === 1 && API.writeByte(0);
                }
                var flushTo = size / 3 | 0;
                while (flushTo--) {
                    a = uI8[tail];
                    b = uI8[tail + 1];
                    c = uI8[tail + 2];
                    b1 = a >> 2;
                    b2 = ((a & 0b11) << 4) + (b >> 4);
                    b3 = ((b & 0b1111) << 2) + (c >> 6);
                    b4 = c & 0b111111;
                    str.push(encode[b1] + encode[b2] + encode[b3] + encode[b4]);
                    tail = (tail + 3) % bufferSize;
                    size -= 3;
                }
                store += str.join("");
            },
            writeByte(byte) {
                uI8[head] = byte;
                const nextPos = (head + 1) % bufferSize;
                size += 1;
                if (nextPos === tail) { API.flush() }
                head = nextPos
            },
            writeShort(v) {
                uI16[0] = v;
                API.writeByte(uI16D8[0]);
                API.writeByte(uI16D8[1]);
            },
            writeLong(v) {
                uI32[0] = v;
                API.writeByte(uI32D8[0]);
                API.writeByte(uI32D8[1]);
                API.writeByte(uI32D8[2]);
                API.writeByte(uI32D8[3]);
            },
            writeSignedLong(v) {
                i32[0] = v;
                API.writeByte(i32D8[0]);
                API.writeByte(i32D8[1]);
                API.writeByte(i32D8[2]);
                API.writeByte(i32D8[3]);
            },
            writeFloat(v) {
                f32[0] = v;
                API.writeByte(f32D8[0]);
                API.writeByte(f32D8[1]);
                API.writeByte(f32D8[2]);
                API.writeByte(f32D8[3]);
            },
            writeDouble(v) {
                f64[0] = v;
                API.writeByte(f64D8[0]);
                API.writeByte(f64D8[1]);
                API.writeByte(f64D8[2]);
                API.writeByte(f64D8[3]);
                API.writeByte(f64D8[4]);
                API.writeByte(f64D8[5]);
                API.writeByte(f64D8[6]);
                API.writeByte(f64D8[7]);
            },
            writeBytes(...bytes) { for (const b of bytes) { API.writeByte(b) } },
            writeShorts(...data) { for (const b of data) { API.writeShort(b) } },
            writeLongs(...data) { for (const b of data) { API.writeLong(b) } },
            writeSignedLongs(...data) { for (const b of data) { API.writeSignedLong(b) } },
            writeFloats(...data) { for (const b of data) { API.writeFloat(b) } },
            writeDoubles(...data) { for (const b of data) { API.writeDouble(b) } },
        };
        return API;
    };
    var dataStream;
    function numToStr(num, dig) {
        num = Number(num);
        if (dig !== undefined) { return num.toFixed(dig).replace(new RegExp("(\\.0{"+dig+"}|0{1,"+dig+"})$","g"), "") }
        return num.toFixed(SVGDig).replace(SVGForNum, "");
    }
    function createMatrixRule(a, b, c, d, e, f, delimit="\n") {
        return "transform:matrix(" +
            numToStr(a, MAT_SR_PREC) + "," +
            numToStr(b, MAT_SR_PREC) + "," +
            numToStr(c, MAT_SR_PREC) + "," +
            numToStr(d, MAT_SR_PREC) + "," +
            numToStr(e, MAT_P_PREC) + ", " +
            numToStr(f, MAT_P_PREC) + ");" + delimit;
    }
    function createTranslateRule(a, b, c, d, e, f, delimit="\n") {
        return "transform: translate(" +
            numToStr(e, MAT_P_PREC) + "px," +
            numToStr(f, MAT_P_PREC) + "px);" + delimit;
    }
    function copyMatrix(m) {
        return [ Math.round(m[0] * MAT_SR_PREC_S) / MAT_SR_PREC_S,
            Math.round(m[1] * MAT_SR_PREC_S) / MAT_SR_PREC_S,
            Math.round(m[2] * MAT_SR_PREC_S) / MAT_SR_PREC_S,
            Math.round(m[3] * MAT_SR_PREC_S) / MAT_SR_PREC_S,
            Math.round(m[4] * MAT_P_PREC_S) / MAT_P_PREC_S,
            Math.round(m[5] * MAT_P_PREC_S) / MAT_P_PREC_S];
    }
    function compareMatrixArray(a, b) {
        var i = 0;
        return a[i] === b[i++] && a[i] === b[i++] && a[i] === b[i++] && a[i] === b[i++] && a[i] === b[i++] && a[i] === b[i++];
    }
    function toView(mat) {
        const x = mat[4];
        const y = mat[5];
        const xax = x + mat[0];
        const xay = y + mat[1];
        const yax = x + mat[2];
        const yay = y + mat[3];
        viewSpr.spr.key.toLocalP(x, y, wp1);
        viewSpr.spr.key.toLocalP(xax, xay, wp2);
        viewSpr.spr.key.toLocalP(yax, yay, wp3);
        return [wp2.x - wp1.x, wp2.y - wp1.y, wp3.x - wp1.x, wp3.y - wp1.y, wp1.x, wp1.y];
    }
    function getPageId(guid) {
        if (!idList.has(guid)) {
            idList.set(guid, {id: classId++});
        }
        return idList.get(guid).id;
    }
    function addSpriteSheet(spr) {
        if (!spriteSheets.has(spr.image.desc.fname)) {
            const subSprites= [];
            var idx = 0;
            for (const s of spr.image.desc.sprites) {
                subSprites.push({
                    idx: s.id,
                    css: [
                        "width: " + s.w + "px;",
                        "height: " + s.h + "px;",
                        "background-position: -" + s.x + "px  -" + s.y + "px;",
                    ]
                });
                idx++;
            };
            spriteSheets.set(spr.image.desc.fname, {
                className: "s"+(classId++),
                css: [
                    "background-image: url('" + spr.image.desc.fname + "');",
                    "background-repeat: no-repeat;"
                ],
                subSprites,
            });
        }
        const sheet = spriteSheets.get(spr.image.desc.fname);
        return sheet.className;
    }
    function SpriteElement(spr) {
        this.spr = spr;
        this.anim = [];
        this.html = [];
        this.classNames = [];
        this.css = [];
        this.reset();
    }
    SpriteElement.prototype = {
        reset() {
            const spr = this.spr;
            this.anim.length = 0;
            this.html.lemgth = 0;
            this.classNames.length = 0;
            this.css.length = 0;
            this.classNames.push("E");
            if (spr.type.text) {
                this.id = "T" + getPageId(spr.guid);
                this.classNames.push("T");
                this.classNames.push(addStyle("    font-family: " + spr.textInfo.font + ";\n    font-size: " + (spr.textInfo.size).toFixed(1) + "px;\n"));
            } else if (spr.type.image) {
                if (spr.type.subSprite) {
                    this.id = "B" + getPageId(spr.guid);
                    const sname = addSpriteSheet(this.spr);
                    this.classNames.push(sname);
                    this.classNames.push(sname + "_"+ this.spr.subSprite.id);
                } else {
                    this.classNames.push("I");
                    !spr.smoothing  && this.classNames.push("P");
                    this.id = "I" + getPageId(spr.guid);
                }

            } else if (spr.type.shape) {
                this.id = "H" + getPageId(spr.guid);
                this.classNames.push("H");
            } else {
                this.id = "K" + getPageId(spr.guid);
            }
        },
        setAsView() {
            if (!this.isView) {
                outputSize.w = this.spr.w;
                outputSize.h = this.spr.h;
            }
            this.isView = true;
            this.classNames.push("A");
            if (animationTypeJavaScript) {
                this.classNames.push("paused");
            }
        },
        get HTML() {
            var str = "";
            if (this.firstFrameNotVisible && !(this.hasTracks & 1)) {
                return "";
            }
            if (this.anim.length) {
                this.classNames.push("A");
            }
            if (this.spr.type.text) {
                str += "<div id=\""+this.id+"\" class=\""+this.classNames.join(" ")+"\">" + this.spr.textInfo.text+"</div>";
            } else if (this.spr.type.image) {
                if(this.spr.type.subSprite) {
                     str += "<div id=\""+this.id+"\" class=\""+this.classNames.join(" ")+"\" ></div>";
                } else {
                    str += "<img id=\""+this.id+"\" class=\""+this.classNames.join(" ")+"\" src=\""+this.spr.image.desc.fname+"\">";
                }
            } else if (this.spr.type.shape) {
                str += "<svg id=\""+this.id+"\" class=\""+this.classNames.join(" ")+"\"  viewBox=\"" + this.box + "\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\">\n";
                str += this.indent + "    <style> .stroke {stroke-linecap:round;stroke-linejoin:round;fill:none;} .fill {fill-rule:evenodd;stroke:none;}</style>\n";
                str += this.indent + "    <path d=\"" + this.pathString + "\" ";
                if (this.spr.shape.strokeWidth === 0) {
                    str += "class=\"fill\"/>\n";
                } else {
                    str += "class=\"stroke\"/>\n";
                }
                str += this.indent + "</svg>\n";


            } else if (this.spr.type.cutter) {
                str += "<div id=\""+this.id+"\" class=\""+this.classNames.join(" ")+"\">";
            }
            return str;
        },
        CSS(indent) {
            if (this.firstFrameNotVisible && !(this.hasTracks & 1)) {
                return "";
            }
            var str = "";
            if (this.anim.length) {
                this.css.push("animation-name: T_"+this.id.slice(1)+";");
            }
            str += indent + "#" + this.id + " {\n";
            for(const line of this.css) {
                str += indent + "    " + line + "\n";
            }
            str += indent + "}\n";
            return str;
        },
        frames(indent) {
            if (this.firstFrameNotVisible && !(this.hasTracks & 1)) {
                return "";
            }
            if (animationTypeJavaScript) {
                if(this.anim.length === 0) { return "" }
                const a = this.anim[0];
                PACKETS.openTrack(dataStream, Number(this.id.slice(1)), a.useA, a.useRGB, a.useMatrix || a.useTranslate);
                for (const a of this.anim) {
                    a.toBuffer(dataStream);
                }
                return "";
            }
            var str = "";
            if (this.anim.length) {
                str += indent + "@keyframes T_"+ this.id.slice(1) + "  {\n";
                for (const a of this.anim) {
                    str += indent + "    " + a.toString() + "\n";
                }
                str += indent + "}\n";
            }
            return str;
        },
        optimiseAnimation() {
            if (this.anim.length) {
                const first = this.anim[0];
                var same = 0b1111;
                for (const a of this.anim) {
                    same &= first.isSame(a);
                }
                this.hasTracks = same ^ 0b1111;
                if (same === 0b1111) {
                    this.anim.length = 0;
                }
                for (const a of this.anim) {
                    if (same & 1) { a.useA = false }
                    if (same & 2) { a.useRGB = false }
                    if ((same & 12) === 12) { a.useTranslate = a.useMatrix = false }
                    if ((same & 12) === 8) {
                        a.useMatrix = false;
                        a.useTranslate = true;
                    }
                    if ((same & 12) === 4) {
                        a.useMatrix = true;
                        a.useTranslate = false;
                    }
                }
            }
        },
        optimiseAnimationRepeats() { // not complete dont use
            if (this.anim.length) {
                if ((same & 12) === 8) { // look for repeats
                    let i = 0, fi = 0;
                    let repeats = false;
                    let repeatCount = false;
                    let repeatSize = 0;
                    while (i < this.anim.length / 2) {
                        fi = i;
                        const a = this.anim[i];
                        let finding = true;
                        while (finding) {
                            let ni = this.anim.findIndex((aa,idx) => idx > fi && aa.matrix[4] === a.matrix[4] && aa.matrix[5] === a.matrix[5]);
                            if (ni > -1) {
                                let nni = ni - i;
                                let nj = ni + nni;
                                repeatCount = 0;
                                repeats = true;
                                while(nj < this.anim.length) {
                                    if (this.anim[nj].matrix[4] === a.matrix[4] && this.anim[nj].matrix[5] === a.matrix[5]) {
                                        nj += nni;
                                        repeatCount ++;
                                    } else {
                                        repeats = false;
                                        break;
                                    }
                                }
                                if(repeats) {
                                    repeatSize = nni;
                                    break;
                                } else { fi = ni }
                            } else {
                                finding = false;
                            }
                        }
                        if(finding && repeats) {
                            let j = 0;
                            while (j < repeatSize && repeats) {
                                let k = 0;
                                const a = this.anim[i +j].matrix;
                                while (k < repeatCount && repeats) {
                                    const next = i + j + k * repeatSize;
                                    if (next < this.anim.length) {
                                        const aa = this.anim[inext].matrix;
                                        if (!(aa[4] === a[4] && aa[5] === a[5])) {
                                            repeats = false;
                                        }
                                    }
                                    k++;
                                }
                                j++;
                            }
                            if(repeats) {
                                this.translateRepeats = true;
                                this.translateRepeatStart = i;
                                this.translateRepeatSize = repeatSize;
                                log("Found repeat: at " + i + " len: " + repeatSize);
                                break;
                            }
                            i ++;
                        } else {
                            i ++;
                        }
                    }
                }
            }
        },
    };
    function Frame(time, eSpr) {
        this.time = time;
        const spr = eSpr.spr;
        if (eSpr.isView) {
            this.matrix = copyMatrix(spr.key.m);
        } else {
            this.matrix = copyMatrix(toView(spr.key.m));
        }
        this.useMatrix = true;
        this.useTranslate = false;
        this.colorType = 0;
        if (!spr.type.cutter) {
            this.a = spr.a;
            this.useA = spr.a !== 1 || (spr.type.animated && spr.animation.tracks.a);
            if (!spr.type.image) {
                this.rgb = spr.rgb.css;
                this.useRGB = true;
                if (spr.type.shape) {
                    this.colorStyleName = spr.shape.strokeWidth === 0 ? "fill" : "stroke";
                    this.colorType = (spr.shape.strokeWidth === 0 ? 1 : 2) << 30;
                } else {
                    this.colorStyleName = "color";
                    this.colorType = 0;
                }
            } else {
                this.useRGB = false;
            }
        } else {
            this.useRGB = false;
            this.useA = false;
        }
        this.use = true;
    }
    Frame.prototype = {
        isSame(frame) {
            var sameFlags = 0;
            if (this.useA === frame.useA && ((this.useA && this.a === frame.a) || !this.useA)) {
                sameFlags += 1;
            }
            if (this.useRGB === frame.useRGB && ((this.useRGB && this.rgb === frame.rgb) || !this.useRGB)) {
                sameFlags += 2;
            }
            if (this.useMatrix === frame.useMatrix) {
                if (!this.useMatrix) {
                    sameFlags += 4;
                    sameFlags += 8;
                } else {
                    const mA = this.matrix;
                    const mB = frame.matrix;
                    sameFlags += compareMatrixArray([0,0,0,0,mA[4],mA[5]], [0,0,0,0,mB[4],mB[5]]) ? 4 : 0;
                    sameFlags += compareMatrixArray([mA[0],mA[1],mA[2],mA[3],0,0], [mB[0],mB[1],mB[2],mB[3],0,0]) ? 8 : 0;
                }
            }
            return sameFlags;
        },
        toBuffer(stream) {
            stream.writeLong((((this.time - startTime) / frameStep) & 0x3FFFFFFF) +  this.colorType);
            this.useA && stream.writeByte(this.a * 255 + 0.5 | 0);
            this.useRGB && stream.writeBytes(parseInt(this.rgb.slice(1,3),16),parseInt(this.rgb.slice(3,5),16),parseInt(this.rgb.slice(5),16));
            (this.useMatrix || this.useTranslate) && stream.writeFloats(...this.matrix);
        },
        toString() {
            var str = "";
            if(this.use) {
                str += numToStr((this.time - startTime) / (endTime - startTime) * 100, 5) + "% {";
                //str += this.useTranslate ? createTranslateRule(...this.matrix, "") : "";
                str += this.useMatrix || this.useTranslate ? createMatrixRule(...this.matrix, "") : "";
                str += this.useA ? "opacity: " + numToStr(this.a, 3) + ";" : "";
                str += this.useRGB ? this.colorStyleName + ": " + this.rgb + ";" : "";
                str += "}";
            }
            return str;
        },
    }
    function addStyle(styleStr) {
        if (commonStyles.has(styleStr)) {
            return commonStyles.get(styleStr).className;
        }
        const className = "cc" + (classId++);
        commonStyles.set(styleStr, {str: styleStr, className});
        return className;
    }
    function createHTML(indent) {
        aSprites.shift();
        const str = indent + "    " + viewSpr.HTML + "\n"
        return aSprites.reduce((str, eSpr) => (eSpr.indent = indent + "        " , str += indent + "        " + eSpr.HTML + "\n"),str) + indent + "    </div>\n";
    }
    function createStyleElement(indent) {
        var str = "";
        str += indent + ".I {\n";
        str += indent + "    image-rendering: auto;\n";
        str += indent + "}\n";
        str += indent + ".I.P {\n";
        str += indent + "    image-rendering: pixelated;\n";
        str += indent + "}\n";
        str += indent + ".T {\n";
        str += indent + "    \n";
        str += indent + "}\n";
        str += indent + ".H {\n";
        str += indent + "    \n";
        str += indent + "}\n";
        str += indent + ".view {\n"
        str += indent + "    position:absolute;\n";
        str += indent + "    border:2px solid black;\n";
        str += indent + "    top:0px;\n";
        str += indent + "    left:0px;\n";
        str += indent + "    width:" + (outputSize.w | 0) + "px;\n";
        str += indent + "    height:" + (outputSize.h | 0) + "px;\n";
        str += indent + "}\n";
        str += indent + ".E {\n";
        str += indent + "    position:absolute;\n";
        str += indent + "}\n";
        str += indent + ".A {\n";
        str += indent + "    position:absolute;\n";
        str += indent + "    animation-duration: " + numToStr((animation.endTime - animation.startTime) * (1000 / 60) * timeScale,3) + "ms;\n";
        str += indent + "    animation-delay: " + numToStr(animation.startTime * (1000 / 60) * timeScale,3) + "ms;\n";
        str += indent + "    animation-iteration-count: infinite;\n";
        str += indent + "    animation-timing-function: "+timingFunction+";\n";
        str += indent + "}\n";
        for (const sheet of spriteSheets.values()) {
            str += indent + "."+sheet.className + " {\n";
            for (const rule of sheet.css) {
                str += indent + "    " + rule + "\n";
            }
            str += indent + "}\n";

            for (const sub of sheet.subSprites) {
                str += indent + "."+sheet.className + "_" + sub.idx + " {\n";
                for (const rule of sub.css) {
                    str += indent + "    " + rule + "\n";
                }
                str += indent + "}\n";
            }
        }

        if (animationTypeJavaScript) {
            str += indent + ".paused {\n";
            str += indent + "    animation-play-state: paused;\n";
            str += indent + "}\n";
        }
        for (const val of commonStyles.values()) {
            str += indent + "." + val.className + " {\n";
            str += indent + val.str;
            str += indent + "}\n"
        }
        str += viewSpr.CSS(indent);
        aSprites.forEach(aSpr => {
            str += aSpr.CSS(indent);
        });
        str += viewSpr.frames(indent);
        aSprites.forEach(aSpr => {
            str += aSpr.frames(indent);
        });
        return str;
    }
    function captureAnimation() {
        return new Promise(done => {
            startAnimCap(sampleStart, sampleCurrentFrame, sampleEnd, done);
        });
    }
    function sampleStart() {
        const vSpr = viewSpr.spr;
        const vKey = vSpr.key;
        viewSpr.css.push("left: " + numToStr(vSpr.x - vSpr.cx) + "px;");
        viewSpr.css.push("top: " + numToStr(vSpr.y - vSpr.cy) + "px;");
        viewSpr.css.push("width: " + numToStr(vSpr.w, 4) + "px;");
        viewSpr.css.push("height: " + numToStr(vSpr.h, 4) + "px;");
        const xScale = outputSize.w / vSpr.w;
        const yScale = outputSize.h / vSpr.h;
        viewSpr.css.push(createMatrixRule(vKey.im[0] * xScale, vKey.im[1] * xScale, vKey.im[2] * yScale, vKey.im[3] * yScale, numToStr(0- (vSpr.x- (vSpr.cx * xScale))), numToStr(0-(vSpr.y-(vSpr.cy * yScale))),""));
        viewSpr.css.push("overflow: hidden;");
        aSprites.forEach(eSpr => {
            const spr = eSpr.spr;
            eSpr.css.push("left: " + numToStr(-spr.cx) + "px;");
            eSpr.css.push("top: " + numToStr(-spr.cy) + "px;");
            if (spr.a !== 1 || (spr.type.animated && spr.animation.tracks.a)) {
                eSpr.css.push("opacity: " + numToStr(spr.a, 3) + ";");
                if (spr.a === 0) {
                    eSpr.firstFrameNotVisible = true
                }
            }

            if (spr.type.text) {
                eSpr.css.push("width: " + numToStr(spr.w, 4) + "px;");
                eSpr.css.push("height: " + numToStr(spr.h, 4) + "px;");
                eSpr.css.push("color: " + spr.rgb.css + ";");
            }
            if (spr.type.image) {
            }
            if (spr.type.shape) {
                eSpr.css.push("width: " + numToStr(spr.w, 4) + "px;");
                eSpr.css.push("height: " + numToStr(spr.h, 4) + "px;");
                if (spr.shape.strokeWidth === 0) {
                    eSpr.css.push("fill: " + spr.rgb.css + ";");
                } else {
                    eSpr.css.push("stroke: " + spr.rgb.css + ";");
                }
                const sp2D = ShadowPath2D();
                spr.shape.create(sp2D,spr);
                eSpr.pathString = sp2D.toString();
                eSpr.box = [-spr.cx, -spr.cy, spr.w, spr.h].join(" ");
            }
            eSpr.css.push(createMatrixRule( ...toView(spr.key.m),""));
        });
        aSprites.unshift(viewSpr);
    }
    function sampleCurrentFrame() {
        aSprites.forEach(eSpr => eSpr.anim.push(new Frame(currentTime, eSpr)));
    }
    function sampleEnd() {
        aSprites.forEach(eSpr => eSpr.optimiseAnimation());
    }
    function startAnimCap(cbStart, cbFrame, cbEnd, done) {
        heartBeat.keepAwake = true;
        startTime = animation.startTime;
        endTime = animation.endTime;
        onFrame = cbFrame;
        onEnd = cbEnd;
        onStart = cbStart;
        onAnimCaptureComplete = done;
        samplingAnimation = true;
        frames = ((endTime - startTime) / frameStep | 0) + 1;
        animation.addEvent("change", animTimeChanged);
        time(startTime);
    }
    function endAnimCap() {
        if (onEnd) { onEnd() }
        samplingAnimation = false;
        animation.removeEvent("change", animTimeChanged);
        onAnimCaptureComplete();
    }
    function animTimeChanged() {
        if(animation.time === nextTimeSample) {
            currentTime = animation.time;
            extraRenders.addOneTimeReady(sampleFrame, 0);
        }
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
    function sampleFrame() {
        currentTime = animation.time;
        if (onStart) { onStart(); onStart = undefined }
        if (onFrame) { onFrame() }
        nextTimeSample += frameStep;
        if (nextTimeSample > endTime) {
            endAnimCap();
            heartBeat.keepAwake = false;
        } else {
            time(nextTimeSample);
        }
    }
    var selectionUsed = false;
    var viewFound = false;
    const API = {
        reset() {
            selectionUsed = false;
            API.viewBox = undefined;
            aSprites.length = 0;
            spriteSheets.clear();
            idList.clear();
            classId = 1;
        },
        select() {
            //shapesById.clear();
            spriteSheets.clear();
            idList.clear();
            classId = 1;
            aSprites.length = 0;
            aSprites.push(...selection.asArray()
                .filter(spr => spr.type.image === true || spr.type.text === true || (spr.type.shape && spr.shape.name === "vectorCommited"))
                .map(spr => new SpriteElement(spr)));
            selectionUsed = true;
        },
        get animationType() { return animationType },
        set animationType(v) {
            if (v === "CSS") {
                animationType = "CSS";
                animationTypeJavaScript = false;
            } else if (v === "JavaScript") {
                animationType = "JavaScript";
                animationTypeJavaScript = true;
            }
        },
        get width() { return outputSize.w },
        get height() { return outputSize.h },
        set width(w) { outputSize.w = w | 0 },
        set height(h) { outputSize.h = h | 0 },
        get frameStep() { return frameStep },
        set frameStep(fs) {
            frameStep = fs | 0;
            frameStep = frameStep < 1 ? 1 : frameStep;
        },
        get timeScale() { return timeScale },
        set timeScale(ts) {
            timeScale = ts;
            timeScale = timeScale < 0.1 ? 0.1 : timeScale;
        },       
        get timingFunction() { return timingFunction },
        set timingFunction(ts) {
            timingFunction = ts.toLowerCase() === "linear" ? "linear" : "steps(1,start)";

        },
        set viewBox(spr) {
            spr.name = "HTML View";
            viewSpr = new SpriteElement(spr)
            viewSpr.setAsView();
        },
        get viewBox() { return viewSpr ? viewSpr.spr : undefined },
        async export(fileName) {
            animation.pause();
            commonStyles.clear();
            if (!selectionUsed) {
                if(viewSpr === undefined) {
                    sprites.each(spr => {
                        if (spr.name === "HTML View") {
                            API.viewBox = spr;
                            return true;
                        }
                    });
                }
                if (viewSpr === undefined) {
                    log.warn("No view box found.");
                    return;
                }
                aSprites.push(...sprites.asArray()
                    .filter(spr => {
                        return (spr.type.image === true || spr.type.text === true || spr.type.shape) && spr !== viewSpr.spr;
                    })
                    .map(spr => new SpriteElement(spr)));
            }
            if (viewSpr === undefined) {
                log.warn("No view box found.");
                return;
            }
            if (animationTypeJavaScript) {
                dataStream = DataBuffer(DATA_SIZE);
            }
            viewSpr.reset();
            aSprites.forEach(s => s.reset());
            viewSpr.setAsView();
            exportId = getGUID();
            await captureAnimation();
            if (animationTypeJavaScript) { PACKETS.writeHead(dataStream) }
            const markup = createHTML("        ");
            var style = createStyleElement("            ");
            var html = "<!DOCTYPE html>\n";
            html += "<html lang=\"en\">\n";
            html += "    <head>\n";
            html += "        <meta http-equiv=\"Content-Type\" content=\"text/html;charset=ISO-8859-8\">\n";
            html += "        <title>" + settings.project + "</title>\n";
            html += "        <meta name=\"keywords\" content=\"PainterV3 HTML, Animation\" />\n";
            html += "        <meta name=\"description\" content=\"PainterV3 HTML (Animation export beta 0.1)\" />\n";
            html += "        <meta name=\"author\" content=\"" + settings.author + "\" />\n";
            html += "        <meta name=\"copyright\" content=\"" + settings.copyright + "\" />\n";
            html += "        <style id=\"style" + exportId + "\">\n";
            html += style;
            html += "        </style>\n";
            html += "    </head>\n";
            html += "    <body>\n";
            html += "        <div id=\"view" + exportId + "\" class=\"view\">\n";
            html += markup;
            html += "        </div>\n";
            if (animationTypeJavaScript) {
                html += "        <script id=\"DECODER\">\n";
                PACKETS.writeText(dataStream,"Painter V3");
                PACKETS.writeEOS(dataStream);
                dataStream.flush(true);
                html += "            ;(()=>{\n";
                html += "                \"use strict\";\n";
                html += "                const d=\"" + dataStream.store +"\";\n";
                html += "                const viewId=\"" + viewSpr.id +"\";\n";
                html += "                const AnimStyleId=\"style" + exportId +"\";\n";
                html += SCRIPT.join("\n                ")+"\n";
                html += "            })();\n";
                html += "        </script>\n";
                dataStream = undefined;
            }
            html += "    </body>\n";
            html += "</html>";
            downloadTextAs(html, fileName + "_" + viewSpr.id, "html");
            log("Downloading '"+fileName+".html' Exported HTML animation");
        }
    };
    return API;
})();

const GameExport = (() => {
	var startTime;
	var endTime;
	var onFrame;
	var onEnd;
	var onStart;
	var onAnimCaptureComplete;
	var samplingAnimation = false;	
	const frameStep = 1;
	var data = {
		types: {
			cutter: 1,
			image: 2,
			subSprite: 3,
		},
		frames: 0,
		startTime: 0,
		endTime: 0,
		sprites: [],
	};
	var sprs = new Map();
	var images = new Map();
	var times = new Set();  // simple bug fix due to duplicated times being sampled
	
    function captureAnimation() {
        return new Promise(done => {
			sprs.clear();
			images.clear();
			times.clear();
            startAnimCap(sampleCurrentFrame, sampleCurrentFrame, sampleEnd, done);
        });
    }	
	function optimiseArray(a) {
		var lv = a[0];
		if (Array.isArray(lv)) {
			for (const v of a) {
				if (!lv.every((vv,i) => vv === v[i])) { return a }
			}
			return [lv];
					
		}
		for (const v of a) {
			if (lv !== v) { return a }
		}
		return [lv | 0];
	}
			
	function getTypeId(spr) {
		if (spr.type.image) {
			if (spr.type.subSprite) { return data.types.subSprite }
			return data.types.image;
		}
		return data.types.cutter;
	}
    function sampleCurrentFrame() {
		if (!times.has(animation.time)) {
			times.add(animation.time);
			const rgb = {r:0, g: 0, b: 0};
			sprites.each(spr => {
				var s = sprs.get(spr.guid);
				if (!s) {
					s = {
						type: getTypeId(spr),
						guid: spr.guid,
						name: spr.name,
						alpha: [],
						color: [],
						mat: [],
					};
					sprs.set(spr.guid, s);
				}
				utils.CSS2RGB(spr.rgb.css, rgb);
				const col = ((rgb.b & 0xff) << 16) + ((rgb.g & 0xff) << 8)  + (rgb.r & 0xff);
				s.color.push(col | 0);
				s.alpha.push(Math.round((spr.a * 100)) / 100);
				s.mat.push([...spr.key.m.map(v => Math.round((v * 1000)) / 1000)]);
				if (spr.type.image) {
					if (!s.imgId) { s.imgId = [] }
					
					if (spr.type.subSprite) {
						if (!s.subIdx) { s.subIdx = [] }
						s.subIdx.push(spr.subSpriteIdx);
					}
					s.imgId.push(spr.image.guid);
					if (!images.has(spr.image.guid)) {
						images.set(spr.image.guid, {
							id: spr.image.guid,
							name: spr.image.desc.name
						});
					}
				}
			});
		}
    }
    function sampleEnd() {
		sampleCurrentFrame();
		for (const spr of sprs.values()) {
			spr.subIdx && (spr.subIdx = optimiseArray(spr.subIdx));
			spr.imgId && (spr.imgId = optimiseArray(spr.imgId));
			spr.alpha = optimiseArray(spr.alpha);
			spr.color = optimiseArray(spr.color);
			
			spr.mat = optimiseArray(spr.mat);
		}
        
    }
    function startAnimCap(cbStart, cbFrame, cbEnd, done) {
        heartBeat.keepAwake = true;
        data.startTime = startTime = animation.startTime;
        data.endTime = endTime = animation.endTime;
        onFrame = cbFrame;
        onEnd = cbEnd;
        onStart = cbStart;
        onAnimCaptureComplete = done;
        samplingAnimation = true;
        data.frames = frames = ((endTime - startTime) / frameStep | 0) + 1;
        animation.addEvent("change", animTimeChanged);
        time(startTime);
    }
    function endAnimCap() {
        if (onEnd) { onEnd() }
        samplingAnimation = false;
        animation.removeEvent("change", animTimeChanged);
        onAnimCaptureComplete();
    }
    function animTimeChanged() {
        if(animation.time === nextTimeSample) {
            currentTime = animation.time;
            extraRenders.addOneTimeReady(sampleFrame, 0);
        }
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
    function sampleFrame() {
        currentTime = animation.time;
        if (onStart) { onStart(); onStart = undefined }
        if (onFrame) { onFrame() }
        nextTimeSample += frameStep;
        if (nextTimeSample > endTime) {
            endAnimCap();
            heartBeat.keepAwake = false;
        } else {
            time(nextTimeSample);
        }
    }	
	const API = {
        async export(fileName) {
			if (samplingAnimation) {
				log.warn("animation capture in progress.");
				return;
			}
			log("Starting animation capture...");
            animation.pause();
            await captureAnimation();	
			data.sprites = [...sprs.values()];
			data.images = [...images.values()];
			data.timeMarks = timeline.marks;
			log("Animation capture complete exporting animation");

			downloadAsJson(data, sprites.sceneName + "_Anim");
			data.sprites = undefined;
			data.images = undefined;
			log("DONE Animation capture");
		}
		
	}
	return API;
})();





const SpriteSheetExporter = (() => {
	/*function createBuffer(size, growBy = 1024 * 8) {
        var firstWarn = 0;
		const API = {
			buf: new ArrayBuffer(size),
			pos: 0,
			markStack: [],
			posStack: [],
			pushMark() { this.markStack.push(this.pos) },
			popMark() {
				this.posStack.push(this.pos);
				this.pos = this.markStack.pop();
			},
			popPos() { this.pos = this.posStack.pop() },
			addBlock(name) {
				API.writeHeaderName(name);
				API.pushMark();
				API.seek(4);
			},
			closeBlock() {
				const p = API.pos;
				API.popMark();
				API.writeInts((p - API.pos) - 4);
				API.popPos();
			},
			downloadBuf(filename) {
				const anchor = document.createElement('a');
				const url = anchor.href = URL.createObjectURL(new Blob([this.buf] ,{type: "application/octet-stream"}));
				anchor.download = filename;
				anchor.dispatchEvent(new MouseEvent("click", {view: window, bubbles: true, cancelable : true} ));
				setTimeout(() => URL.revokeObjectURL(url) , 1000);
			},			
			grow(space) {
				if (this.pos + space >= this.buf.length) {
					const newBuf = new ArrayBuffer(this.buf.length + growBy);
					const nb8 = new Uint8Array(newBuf);
					const b8 = new Uint8Array(this.buf);
					nb8.set(b8);
					this.buf = newBuf;
				}
			},
			close() {
				const len = (((this.pos / 4) | 0)  + 1) * 4;
				const newBuf = new ArrayBuffer(len);
				const nb8 = new Uint8Array(newBuf);
				const b8 = new Uint8Array(this.buf);
				var i = 0;
				while (i < this.pos) { nb8[i] = b8[i++] }
                while (i < len) { nb8[i++] = 0; }
				this.buf = newBuf;
                return len;
			},			
			seek(steps) {
				this.grow(steps);
				this.pos += steps;
			},
			writeHeaderName(str) {
                if (this.pos % 4) { throw new RangeError("Write Header '" + str + "' alignment error out by " + (this.pos % 4) + "bytes"); }                
				this.grow(4);
				const b8 = new Uint8Array(this.buf);
				b8[this.pos++] = str.charCodeAt(0);
				b8[this.pos++] = str.charCodeAt(1);
				b8[this.pos++] = str.charCodeAt(2);
				b8[this.pos++] = str.charCodeAt(3);
			},
			writeInts(...ints) {
                if (this.pos % 4) { throw new RangeError("Write int alignment error out by " + (this.pos % 4) + "bytes"); }
				this.grow(ints.length * 4);
				const b32 = new Uint32Array(this.buf);
				var i = 0, idx = this.pos / 4 | 0;
				while (i < ints.length) { b32[idx + i] = ints[i++] }
				this.pos += ints.length * 4;
			},
			writeFloats(...floats) {
                if (this.pos % 4) { throw new RangeError("Write float alignment error out by " + (this.pos % 4) + "bytes"); }
				this.grow(floats.length * 4);
				const f32 = new Float32Array(this.buf);
				var i = 0, idx = this.pos / 4 | 0;
				while (i < floats.length) { f32[idx + i] = floats[i++] }
				this.pos += floats.length * 4;
			},			
			writeShorts(...shorts) {
                if (this.pos % 2) { throw new RangeError("Write short  alignment error out by " + (this.pos % 2) + "bytes"); }
				this.grow(shorts.length * 2);
				const b16 = new Uint16Array(this.buf);
				var i = 0, idx = this.pos / 2 | 0;
				while (i < shorts.length) { b16[idx + i] = shorts[i++] }
				this.pos += shorts.length * 2;
			},
			writeString(str) {
				var len = str.length + 1;
				var tLen = (((len / 4) | 0) + 1) * 4 + 4;
				this.grow(tLen);
				this.writeShorts(tLen - 2, len);				
				const b8 = new Uint8Array(this.buf);
				var i = 0, idx = this.pos;
				while (i < len) { b8[idx + i] = str.charCodeAt(i++) }
				b8[idx + i] = 0;
				this.pos += tLen - 4;
			},
			writeBytes(...bytes) {
                if ((this.pos % 4) && firstWarn === 0) { log.warn("Byte alignment warning."); firstWarn = 1; }
                this.grow(bytes.length);
				const b8 = new Uint8Array(this.buf);
				var i = 0, idx = this.pos;
				while (i < bytes.length) { b8[idx + i] = bytes[i++] }
				this.pos += bytes.length;
			},            
            showState(mess) { log("At pos: " + this.pos + " " + mess); }
		};
		return API;
	}*/


/*
   exportScene
  |--------------------------------------------------------------------------------------|
  | Format of Level export                                                               |
  | fx, fy float coordinate                                                              |
  | fr  float angle in radians   
  | blockID 4 chars defining block. followed by uint 32bit block size in bytes
  |--------------|------------|----------------|-----------------------------------------|
  |  Byte offset | Size Bytes |  Name          |  Details                                |
  |--------------|------------|----------------|-----------------------------------------|
  |    0         |   char  4  |  blockID       |   == "ANIM"                             |
  |    4         |   uint  4  |  blockSize     |   dist to next block                    |
  |              |            |                |                                         |
  |              |   uint  4  |  startTime     |                                         |
  |              |   uint  4  |  endTime       |                                         |
  |              |   uint  4  |  frameLength   |   in game frames 1/60 second            |
  |              |   uint  4  |  spriteCount   |                                         |
  |              |            |                |                                         |
  |              |   char  4  |  blockID       |   TRKU                                  |
  |              |   uint  4  |  blockSize     |   size in bytes                         |
  |              |            |                |                                         |
  |              |            |                |                                         |
  |              |            |                |                                         |
  |--------------|------------|----------------|-----------------------------------------|
  |   TRKF       |  block Animation track using uniform transform                                                               |
  |--------------|------------|----------------|-----------------------------------------|
  |    0         |   char  4  |  blockID       | == "TRKF"                               |
  |              |   uint  4  |  blockSize     | size in bytes                           |
  |              |   uint  4  |  pv3UID        |Unique PainterV3 sprite identifier(pV3ID)|
  |              |   uint  4  |  attachedUID   | Unique (pV3ID) if attached              |
  |              |            |                | else this value is 0                    |
  |              |   uint  4  |  StartFrame    |                                         |
  |              |   uint  4  |  EndFrame      | inclusive                               |  
  |              |   ushort 2 |  Flags         | !VIS bit 0 if no item is non visible    |
  |              |            |                | GSPR bit 1 if on item is in sprite sheet|
  |              |   ushort 2 |  null          | Padding                                 |
  |--------------|------------|----------------|-----------------------------------------|
  |              |   for each frame                                                      |
  |--------------|------------|----------------|-----------------------------------------|
  |              |   float 4  |  centerX       |                                         |
  |              |   float 4  |  centerY       |                                         |
  |              |   float 4  |  angle         |                                         |
  |              |   float 4  |  width         |                                         |
  |              |   float 4  |  height        |                                         |
  |              |   uint  4  |  RGBA          | color as bytes                          |
  |              |   uint  4  |  spriteUID     | Sprite sheet idx. Only if flag GSPR on  |
  |--------------|------------|----------------|-----------------------------------------|
  |--------------|------------|----------------|-----------------------------------------|
  |   TRKU       |  block Animation track using uniform transform                                                               |
  |--------------|------------|----------------|-----------------------------------------|
  |    0         |   char  4  |  blockID       | == "TRKU"                               |
  |              |   uint  4  |  blockSize     | size in bytes                           |
  |              |   uint  4  |  pv3UID        | Unique PainterV3 (pV3) sprite identifier|
  |              |            |                | UID is unique (pV3) install and can be  |    
  |              |            |                | reset                                   |
  |              |   uint  4  |  attachedUID   | Unique (pV3ID) if attached              |
  |              |   uint  4  |  StartFrame    |                                         |
  |              |   uint  4  |  EndFrame      | inclusive                               |
  |--------------|------------|----------------|-----------------------------------------|
  |              |   for each frame                                                      |
  |--------------|------------|----------------|-----------------------------------------|
  |              |   float 4  |  centerX       |                                         |
  |              |   float 4  |  centerY       |                                         |
  |              |   float 4  |  angle         |                                         |
  |              |   float 4  |  width         |                                         |
  |              |   float 4  |  height        |                                         |
  |--------------|------------|----------------|-----------------------------------------|
  |--------------|------------|----------------|-----------------------------------------|
  |   ITEM       |  block unanimated uniform item                                                              |
  |--------------|------------|----------------|-----------------------------------------|
  |    0         |   char  4  |  blockID       | == "ITEM"                               |
  |              |   uint  4  |  blockSize     | size in bytes                           |
  |              |   uint  4  |  pv3UID        | Unique PainterV3 (pV3) identifier       |
  |              |            |                | UID is unique (pV3) install and can be  |    
  |              |            |                | reset                                   |
  |              |   uint  4  |  attachedUID   | Unique (pV3ID) if attached              |
  |              |   ushort 2 |  Flags         | !VIS bit 0 if no item is non visible    |
  |              |            |                | GSPR bit 1 if on item is in sprite sheet|
  |              |   ushort 2 |  null          | Padding                                 |
  |              |   float 4  |  centerX       | X Position of center                    |
  |              |   float 4  |  centerY       | Y Position of center                    |
  |              |   float 4  |  angle         | Radians                                 |
  |              |   float 4  |  width         |                                         |
  |              |   float 4  |  height        |                                         |
  |              |   uint  4  |  RGBA          | color as bytes                          |
  |              |   uint  4  |  spriteUID     | Sprite sheet idx. Only if flag GSPR on  |
  |--------------|------------|----------------|-----------------------------------------|  
  
  
17060

*/
    function failed(message) {
        log.warn(message);
        failed.state = true;
    }
    var nextTimeSample;
    var buf;
    var baseSprite;
    var eStart;
    var eEnd;
    const items = new Map();
    const namedIds = new Map();
    function AddItem(spr) {
        if (spr.type.linked && spr.linked === baseSprite) { // !spr.linkers && !spr.type.linked) {
            var it;
            //const animTime = spr.getAnimTimeExtent();
            items.set(spr.guid, it = {
                spr,
                start: eStart,
                end: eEnd,
                flags: 0,
                type: "TRKF",
                animated: false,
                frames:[],
            });
            var named = namedIds.get(spr.name);
            if (!named) { namedIds.set(spr.name, named = {ids:[]}); }
            named.ids.push(spr.guid);
        }
    }   
    function startSceneExport(approxSize) {
        heartBeat.keepAwake = true;
        buf = createRiffBuffer(approxSize);	
        animation.addEvent("change", animTimeChanged);
    }
    function endAnimCapture() {
        animation.removeEvent("change", animTimeChanged);
        heartBeat.keepAwake = false;
    }
    function animTimeChanged() {
        if(animation.time === nextTimeSample) {
            currentTime = animation.time;
            extraRenders.addOneTimeReady(sampleFrame, 0);
        }
    }    
    function seekTime(time, cb) {
        sampleFrame = cb;
        nextTimeSample = time;
        if (animation.time === time) {
            animTimeChanged();
        } else {
            animation.time = time;
        }        
    }  
	const API = {
        exportScene() {
            function captureFrame() {
                for (const it of items.values()) {
                    /*if (it.start === 0 && it.end === 0) {
                        if (it.frames.length === 0) {
                            it.type = "ITEM";
                            it.flags = 0b00;
                            //var sIdx = 0;
                            if (it.spr.type.subSprite) { // && it.spr.image.desc.sprites[0].gSpr) {
                                //sIdx = it.spr.image.desc.sprites[it.spr.subSpriteIdx].uid;
                                it.flags = 0b10;
                            }
                            var A = it.spr.a * 255 | 0;
                            var R = parseInt(it.spr.rgb.css.slice(1, 3), 16);
                            var G = parseInt(it.spr.rgb.css.slice(3, 5), 16);
                            var B = parseInt(it.spr.rgb.css.slice(5, 7), 16);
                            it.frames.push({
                                x: it.spr.x,
                                y: it.spr.y,
                                r: it.spr.rx,
                                w: it.spr.w * it.spr.sx,
                                h: it.spr.h * it.spr.sy,
                                R, G, B, A,
                                sIdx: it.spr.subSpriteIdx,
                            });                        
                        }
                    } else  
                        */
                   // if (it.start <= nextTimeSample && it.end >= nextTimeSample) {
                        //if (it.spr.type.subSprite) {
                            const p1 = utils.point;
                            p1.x = it.spr.x;
                            p1.y = it.spr.y;
                            baseSprite.key.toLocalPoint(p1);
                            p1.x -= baseSprite.sx * baseSprite.w * 0.5;
                            p1.y -= baseSprite.sy * baseSprite.h * 0.5;
                            
                            var A = it.spr.a * 255 | 0;
                            var R = parseInt(it.spr.rgb.css.slice(1, 3), 16);
                            var G = parseInt(it.spr.rgb.css.slice(3, 5), 16);
                            var B = parseInt(it.spr.rgb.css.slice(5, 7), 16);
                           // var sIdx = it.spr.image.desc.sprites[it.spr.subSpriteIdx].uid;
                            if (it.spr.type.subSprite) { it.flags |= 0b10; }
                            if (it.spr.type.cutter) { it.flags |= 0b100; }
                            const sIdx = it.spr.subSpriteIdx !== undefined ? it.spr.subSpriteIdx : 0
                            it.frames.push({
                                x: p1.x,
                                y: p1.y,
                                r: it.spr.rx - baseSprite.rx,
                                w: it.spr.w * it.spr.sx,
                                h: it.spr.h * it.spr.sy,
                                R, G, B, A,
                                sIdx
                                
                            });                        
                            if (!it.animated && it.frames.length > 1) {
                                const fr = it.frames[it.frames.length - 2];
                                if (fr.x !== p1.x ||
                                    fr.y !== p1.y ||
                                    fr.r !== it.spr.rx - baseSprite.rx ||
                                    fr.w !== it.spr.w * it.spr.sx ||
                                    fr.h !== it.spr.h * it.spr.sy ||
                                    fr.R !== R ||
                                    fr.G !== G ||
                                    fr.B !== B ||
                                    fr.A !== A ||
                                    fr.sIdx !== sIdx) {
                                        it.animated = true;
                                }
                                        
                                
                            }
                        //}
                        /* else {
                            it.type = "TRKU";
                            it.frames.push({
                                x: it.spr.x,
                                y: it.spr.y,
                                r: it.spr.rx,
                                w: it.spr.w * it.spr.sx,
                                h: it.spr.h * it.spr.sy
                            });
                        }*/
                    //}
                }
                if (nextTimeSample < end) {
                    seekTime(nextTimeSample + 1, captureFrame);
                } else {
                    seekTime(cTime, writeBuffers);
                    
                }
            }       

            /*------------------------------*/
            /* WARNING WARNING  WARNING     */
            /*------------------------------*/
            /* Remember buffer alignment is */
            /* 4 bytes. You can not write a */
            /* float at 10, must be 8 or 12 */
            /* etc                          */
            /*------------------------------*/
            /* WARNING WARNING  WARNING     */
            /*------------------------------*/            
            /*
            chunk ANIM
                int start                   // time is in frames (1/60th second base rate)
                int end
                int speed
                int itemCount               // number of following chunks
                [
                    | chunk TRKF            // full animation
                        int UID
                        int attachedToUID   // 0 is not attached
                        int firstFrame
                        int lastFrame
                        short flags
                        short reserved
                        [
                            float x y r w h
                            byte r g b a
                            int uid         // sub sprite idx
                            ...
                        ]
                    | chunk ITEM            // has no animation
                        int UID
                        int attachedToUID   // 0 is not attached
                        short flags
                        short reserved
                        float x y r w h
                        byte r g b a
                        int uid             // sub sprite idx
                ]                     
            */
            function writeBuffers() {
                endAnimCapture();
                log("Block open ANIM");
                buf.addBlock("ANIM");
                buf.writeInts(start, end, 1 / speed, items.size);    
                for (const it of items.values()) {
                    it.type = it.animated && it.frames.length > 0 ? "TRKF" : "ITEM";
                    if (it.type === "TRKF") {
                        buf.addBlock("TRKF"); 
                        const attUID = it.spr.type.attached ? it.spr.attachedTo.guid : 0;
                        buf.writeInts(it.spr.guid, attUID, it.start, it.end);
                        buf.writeShorts(it.flags, 0);
                        for (const f of it.frames) {
                            buf.writeFloats(f.x, f.y, f.r, f.w, f.h);
                            buf.writeBytes(f.R, f.G, f.B, f.A);
                            buf.writeInts(f.sIdx); 
                        }
                        buf.closeBlock();
                    } else if (it.type === "ITEM") {
                        buf.addBlock("ITEM");   
                        const attUID = it.spr.type.attached ? it.spr.attachedTo.guid : 0;
                        buf.writeInts(it.spr.guid, attUID); 
                        buf.writeShorts(it.flags, 0); 
                        const f = it.frames[0];   
                        buf.writeFloats(f.x, f.y, f.r, f.w, f.h);
                        buf.writeBytes(f.R, f.G, f.B, f.A);
                        buf.writeInts(f.sIdx);                        
                        buf.closeBlock();
                    }
                }
                buf.closeBlock();
                const fileSize = buf.close();
                const names = {};
                for (const [name, named] of namedIds.entries()) {
                    names[name] = named.ids;
                }
				log("Saving scene animation  '" + sceneName + ".bin" + "'");
				buf.downloadBuf(sceneName + ".bin");
                const info = {
                    content: {
                        sessionID: getGUID() * getGUID(),
                        forFile: "scene animation  '" + sceneName + ".bin" + "'",
                        fileSize: fileSize + " bytes",
                        details: "named"
                    },
                    named: names,
                }
                downloadAsJson(info, sceneName + "_scene");                    
            }

    
            const cTime = animation.time;
            var sceneName;
            const start =  eStart = animation.startTime;
            const end = eEnd = animation.endTime;
            const speed = animation.speed;
            if (selection.length == 1) {
                baseSprite = selection[0];    
                sceneName = baseSprite.name;                
                sprites.each(spr => { AddItem(spr); });
                
                if (failed.state) { return }
                startSceneExport(items.size * (((end - start) + 1) * 32 + 20) + 2048);
                seekTime(start, captureFrame);
                
            } else {
                failed("Select ONE sprite that has linked sprites")
            }
            if (failed.state) { return }

           
            
        },
        busy: false,
        exportSimple: false,
		export(saveAll = true) {
            this.busy = true;
			const p1 = utils.point, p2 = utils.point, p3 = utils.point, p4 = utils.point;
			var x, y, xx, yy;
			const ids = new Map();
			var nId = 0;
			const getId = (name) => {
				if (ids.has(name)) { return ids.get(name) } 
				ids.set(name, nId++);
				return nId - 1;
			}
			const getArea = (spr, over) => {
				spr.key.corners(p1, p2, p3, p4);
				over.key.toLocalPoint(p1);
				over.key.toLocalPoint(p2);
				over.key.toLocalPoint(p3);
				over.key.toLocalPoint(p4);				
				x = Math.round(Math.min(p1.x, p2.x, p3.x, p4.x));
				y = Math.round(Math.min(p1.y, p2.y, p3.y, p4.y));
				xx = Math.round(Math.max(p1.x, p2.x, p3.x, p4.x));
				yy = Math.round(Math.max(p1.y, p2.y, p3.y, p4.y));
			}
			var sW, sH;
			var minId = Infinity;
            var maxMarks = 0;
			const allSpriteSheets = {};	
			var saveJson = true;
			var sheetSpr;
			selection.eachOfType(spr => {
				sheetSpr = spr;
				/*if (spr.image.desc.sprites && spr.linkers === undefined) {
                    log.warn("Direct sprite sheet export no longer supported by game engine.");
					allSpriteSheets[spr.name] = {
						sprites: spr.image.desc.sprites.map((s, i) => ({x: s.x, y: s.y, w: s.w, h: s.h, cx: 0.5, cy: 0.5, id: 0, uid: i})),
						ids: {},
						links: [],
					};
					saveJson = false;
					return true;
				}*/
				const sprPos = new Map();
				allSpriteSheets[spr.name] = {sprites: [], ids: {}, links: [], anims: []};
				const aSprs = new Set();
				if (spr.linkers) {
					for (const s of spr.linkers) {
						aSprs.add(s);
						getArea(s, spr);
						const mspr = {
							x, y, w: xx - x, h: yy - y,
							cx: 0.5, cy: 0.5,
                            marks: [],
                            grpMarks: new Map(),
							id: getId(s.name),
                            name: s.name,
							uid: s.guid,
						};
						minId = Math.min(minId, s.guid);
						if (s.linkers) {
                            let secondPass = false;
                            let sort = false;

							for (const ss of s.linkers) {
                                // name Mark to add marks starting at A (a) to Z (z)
                                if (ss.name.toLowerCase().startsWith("orderedmark") || ss.name.toLowerCase().startsWith("omark")) {
                                    secondPass = true;
                                } else if (ss.name.toLowerCase().startsWith("vecpoint")) {
                                    secondPass = true;                                    
                                } else if (ss.name.toLowerCase().startsWith("unorderedmark") || ss.name.toLowerCase().startsWith("uomark") || ss.name.toLowerCase().startsWith("umark")) {
                                    secondPass = true;
                                    
                                } else if (ss.name.toLowerCase().startsWith("groupmark_")) {
                                    if (ss.linkers) {
                                        const gName = ss.name.replace(/groupmark_/i, "");
                                        let gGroup = mspr.grpMarks.get(gName);
                                        if (!gGroup) {
                                            gGroup = {marks: [], first:0, count: 0, name: s.name};
                                            mspr.grpMarks.set(gName, gGroup);
                                        }
                                        for (const sss of ss.linkers) {
                                            p1.x = sss.x;
                                            p1.y = sss.y;
                                            spr.key.toLocalPoint(p1);
                                            gGroup.marks.push({x: p1.x - mspr.x, y: p1.y - mspr.y, ordered: true});
                                            gGroup.count ++;
                                            aSprs.add(sss);    
                                        }
                                        sort = true;                                        
                                    }                                    
                                } else if (ss.name.startsWith("mark") || ss.name.startsWith("Mark")) {
                                    const markIdx = ss.name[4].toLowerCase().charCodeAt(0) - ("a").charCodeAt(0);
									p1.x = ss.x;
									p1.y = ss.y;
									spr.key.toLocalPoint(p1);
                                    mspr.marks[markIdx] = {x: p1.x - mspr.x, y: p1.y - mspr.y, ordered: true};
                                    aSprs.add(ss);                                    
                                } else if (ss.name === "center" || ss.name === "Center") {
									p1.x = ss.x;
									p1.y = ss.y;
									spr.key.toLocalPoint(p1);
									mspr.cx = (p1.x - mspr.x) / mspr.w;
									mspr.cy = (p1.y - mspr.y) / mspr.h;
									getArea(ss, s);
									mspr.c = {x, y, w: xx - x, h: yy - y, uid: ss.guid};
									minId = Math.min(minId, ss.guid);
                                    aSprs.add(ss);
								} else {
									if (mspr.a === undefined) {
										mspr.a = [];
									}
									getArea(ss, s);
									mspr.a.push({x, y, w: xx - x, h: yy - y, id: getId(ss.name), uid: ss.guid});
									minId = Math.min(minId, ss.guid);
                                    aSprs.add(ss);
								}
							}
                            if (secondPass) {
                                function addLinkers(linkers, level = 0) {
                                    for (const ss of linkers) {
                                        if (ss.name.toLowerCase().startsWith("orderedmark") || 
                                            ss.name.toLowerCase().startsWith("omark")) {
                                            const sortBy = ss.name.toLowerCase().replace(/(orderedmark|omark)( |_)/i, "");
                                            p1.x = ss.x;
                                            p1.y = ss.y;
                                            spr.key.toLocalPoint(p1);
                                            mspr.marks.push({x: p1.x - mspr.x, y: p1.y - mspr.y, ordered: true, sortBy, level});
                                            aSprs.add(ss);  
                                            if (ss.linkers) {
                                                addLinkers(ss.linkers, level + 1);
                                            }
                                        } else if (level === 0 && ss.name.toLowerCase().startsWith("vecpoint")) {
                                            const sortBy = "vP";
                                            p1.x = ss.x;
                                            p1.y = ss.y;
                                            spr.key.toLocalPoint(p1);
                                            mspr.marks.push({x: p1.x - mspr.x, y: p1.y - mspr.y, sortBy,  ordered: false});
                                            aSprs.add(ss);                                    
                                        } else if (level === 0 && (
                                            ss.name.toLowerCase().startsWith("unorderedmark") || 
                                            ss.name.toLowerCase().startsWith("uomark")  || 
                                            ss.name.toLowerCase().startsWith("umark")  
                                            )) {
                                            const sortBy = ss.name.toLowerCase().replace(/(unorderedmark|uomark|umark)( |_)/i, "");
                                            p1.x = ss.x;
                                            p1.y = ss.y;
                                            spr.key.toLocalPoint(p1);
                                            mspr.marks.push({x: p1.x - mspr.x, y: p1.y - mspr.y, sortBy,  ordered: false});
                                            aSprs.add(ss);                                    
                                        }
                                        
                                        
                                    }
                                }
                                addLinkers(s.linkers);
                                sort = true;
                            }
                            if (sort) {
                                mspr.marks.sort((a, b) => {
                                    if (a.ordered === false && b.ordered === false) { return 0 }
                                    if (a.ordered === false && b.ordered === true) { return 0 }
                                    if (a.ordered === true && b.ordered === false) { return 1 }
                                    if (a.ordered && b.ordered) { 
                                        if (a.sortBy && b.sortBy) {
                                            if (a.sortBy < b.sortBy) { return -1 }
                                            if (a.sortBy > b.sortBy) { return 1 }
                                            if (a.level > b.level) { return -1 }
                                            if (a.level < b.level) { return 1 }
                                            if (a.y < b.y) { return -1 }
                                            if (a.y > b.y) { return 1 }
                                            return a.x - b.x;
                                        }
                                        if (a.sortBy) { return -1 }
                                        if (b.sortBy) { return 1 }
                                    }
                                    if (a.ordered && !b.ordered) { return -1 }
                                    if (!a.ordered && b.ordered) { return 1 }
                                    if (a.y < b.y) { return -1 }
                                    if (a.y > b.y) { return 1 }
                                    return a.x - b.x;
                                });
                                for (const [name, grp] of mspr.grpMarks.entries()) {
                                    grp.start = mspr.marks.length;
                                    mspr.marks.push(...grp.marks);
                                }
                            }
						}
						allSpriteSheets[spr.name].sprites.push(mspr);
					}
				}
				for (const [name, id] of ids.entries()) {
					allSpriteSheets[spr.name].ids[name] = id;
				}
				sprites.eachOfType(({name, fLink}) => {
					if (fLink.type === "A") {
						if (fLink.inFrom == "An") {
							const anim = {isAnim: true, name, uids: []};
							for (const s of fLink.inputs) {
								if (aSprs.has(s)) {
									anim.uids.push(s.guid);
								}
							}
							if (anim.uids.length) {
								allSpriteSheets[spr.name].anims.push(anim);
							}
						} else {
							const links = {isLinks: true, from: [], to: []};
							for (const s of fLink.inputs) {
								if (aSprs.has(s)) {
									links.from.push(s.guid);
								}
							}
							for (const s of fLink.outputs) {
								if (aSprs.has(s)) {
									links.to.push(s.guid);
								}
							}
							if (links.from.length && links.to.length) {
								allSpriteSheets[spr.name].links.push(links);
							}
						}
					}
				},"functionLink");				
				ids.clear();				
				return  true; // only first sprite
			}, "image");
			for (const name of Object.keys(allSpriteSheets)) {
				let i = 0;
				const sprs = allSpriteSheets[name];
                groupMarks = {};
                sprs.sprites.forEach(mspr => {
                    if (mspr.grpMarks.size) {
                        const groups = {};
                        var gName;
                        for (const [name, grp] of mspr.grpMarks.entries()) {
                            gName = grp.name;
                            groups[name] = {start: grp.start, length: grp.count};
                        }
                        groupMarks[gName] = groups;
                    }
                });
				const info = {
                    a_Notes: [
                        "For use with GrooverGL native BatchSprites (GbS)",
                        "Index of namedSprites.",
                        "Indexes start at 1 as loader (GbS) adds",
                        "sprite at idx 0 that is width and height of image.",
                    ],
                    namedAnimations: sprs.anims.reduce((n, s, i) => (n[s.name] = i, n), {}),
                    namedIds: allSpriteSheets[name].ids,
                    groupMarks,
                    namedSprites: sprs.sprites.reduce((n, s) => {
                        if (n[s.name] === undefined) {
                            if (s.marks.length) {
                                const named = {};
                                n[s.name] = {
                                    idxs: [(i++) + 1],
                                    marks: [s.marks.map((m, i) => { 
                                        const sb = m.sortBy ? m.sortBy : "?";
                                        if (!named[sb]) { named[sb] = []; }
                                        named[sb].push(i);
                                        return m ? [m.x, m.y] : []
                                    })],
                                    named,
                                };
                            } else {
                                n[s.name] = { idxs: [(i++) + 1] };
                            }
                        } else {
                            n[s.name].idxs.push((i++) + 1);
                            if (s.marks.length) {
                                if (n[s.name].marks === undefined) { n[s.name].marks = []; n[s.name].named = {} }                                    
                                n[s.name].marks.push(s.marks.map((m, i) => {
                                    const sb = m.sortBy ? m.sortBy : "?";
                                    if (!n[s.name].named[sb]) { n[s.name].named[sb] = []; }
                                    n[s.name].named[sb].push(i);
                                    return m ? [m.x, m.y] : [];
                                }));
                            }
                        }
                        return n;
                    }, {}),
                    spriteDetails: sprs.sprites.reduce((n, s, idx) => {
                        if (n[s.name] === undefined) { n[s.name] = []; }
                        n[s.name].push({
                            idx: idx + 1, 
                            x: s.x,
                            y: s.y,
                            w: s.w,
                            h: s.h,
                            cx: Math.round(s.cx * 4 * s.w) / 4,
                            cy: Math.round(s.cy * 4 * s.h) / 4,
							id: s.id,
							uid: s.uid,    
                        });                           
                        return n;
                    }, {})
                };
				i = 0;                
                const spritesArr = [];
				while (i < sprs.sprites.length) {
					const s = sprs.sprites[i++];
                    spritesArr.push({
                        x: s.x, y: s.y,
                        w: s.w, h: s.h,
                        cx: s.cx, cy: s.cy,
                        id: s.id, uid: (s.uid - minId) + 1,
                        gSpr: true,
                        name: s.name,
                    });
                }
                sheetSpr.image.desc.sprites = spritesArr;
                sheetSpr.image.desc.subSprCount = spritesArr.length;

                if (!saveAll) {
                    log.info("Created " + spritesArr.length + " sub sprites");
                    this.busy = false;
                    return;
                }
                if (!API.exportSimple) {
                    /*------------------------------*/
                    /* WARNING WARNING  WARNING     */
                    /*------------------------------*/
                    /* Remember buffer alignment is */
                    /* 4 bytes. You can not write a */
                    /* float at 10, must be 8 or 12 */
                    /* etc                          */
                    /*------------------------------*/
                    /* WARNING WARNING  WARNING     */
                    /*------------------------------*/
                    const buf = createRiffBuffer(2048 * 8);	
                    buf.addBlock("SPRM");
                    i = 0;                
                    buf.writeInts(sprs.sprites.length);
                    buf.writeShorts(sheetSpr.image.w, sheetSpr.image.h);
                    while (i < sprs.sprites.length) {
                        const s = sprs.sprites[i];
                    //for (const s of sprs.sprites) {                
                        buf.writeShorts(s.x, s.y, s.w, s.h);
                        buf.writeFloats(s.cx, s.cy);
                        buf.writeShorts(s.id, (s.uid - minId) + 1);
                        if (s.marks.length > 0) {
                            buf.writeShorts(s.marks.length, 0);                
                            for (const m of s.marks) {
                                if (!m) { buf.writeFloats(0, 0) }
                                else { buf.writeFloats(m.x, m.y) }
                            }
                        } else { buf.writeShorts(0, 0); }
                        i++;
                    }
                    buf.closeBlock();
                    const hasAnims = sprs?.anims?.length > 0;
                    if (hasAnims) {
                        buf.addBlock("anim");
                        buf.writeShorts(sprs.anims.length);
                        for (const anim of sprs.anims) {
                            buf.writeString(anim.name);
                            buf.writeShorts(anim.uids.length);
                            buf.writeShorts(...anim.uids.map(id => (id - minId) + 1));
                        }
                        buf.closeBlock();
                    }
                    const fileSize = buf.close();
                    buf.downloadBuf(sheetSpr.image.desc.name + ".bin");
                    log("Saving sprite sheet layout  '" + sheetSpr.image.desc.name + ".bin" + "' " + sprs.sprites.length + " sprites ");
                    info.a_Notes.push("Saved as '" + sheetSpr.image.desc.name + ".bin" + "' " + fileSize + "bytes " + sprs.sprites.length + " sprites");
                    saveJson && downloadAsJson(info, sheetSpr.image.desc.name);
                } else {
                    var jsStr = "const spriteSets = {\n";
                    for (const [name, sprites] of Object.entries(info.spriteDetails)) {
                        jsStr += "    " + name + ": [\n";
                        for (const spr of sprites) {
                            jsStr += "        {";
                            jsStr += "x: " + spr.x;
                            jsStr += ", y: " + spr.y;
                            jsStr += ", w: " + spr.w;
                            jsStr += ", h: " + spr.h;
                            jsStr += ", cx: " + spr.cx;
                            jsStr += ", cy: " + spr.cy;
                            if (info.namedSprites[name].marks) {
                                jsStr += ",\n        marks: [\n";
                                for (const set of info.namedSprites[name].marks) {
                                    jsStr += "            [";
                                    var s = "";
                                    for (const pos of set) {
                                        jsStr += s + pos[0] + ", " + pos[1];
                                        s= ", ";
                                    }
                                    jsStr += "],\n";
                                }
                                jsStr += "        ]";
                            }
                            jsStr += "},\n";         
                        }
                        jsStr += "    ],\n";
                    }
                    jsStr += "};\n"
                    downloadTextAs(jsStr, sheetSpr.image.desc.name, ".js");

                }
                
                this.busy = false;
			}
		},
        AoidsRockLocationExport() {
            const locations = [];
            selection.each(spr => {
				if (spr.linkers && spr.type.image) {
                    const loc = {
                        uid: spr.guid,
                        w: Math.round(spr.w * 10) / 10,
                        h: Math.round(spr.h * 10) / 10,
                        px: spr.image.desc.pixelCount,
                        chkSum: spr.image.desc.pixelChkSum,
                        contains: [...spr.linkers].map(s => {
                            const p1 = utils.point;
                            p1.x = s.x;
                            p1.y = s.y;
                            spr.key.toLocalPoint(p1);
                            return {
                                x: Math.round(p1.x * 100) / 100,
                                y: Math.round(p1.y * 100) / 100,
                                r: Math.round((s.rx - spr.rx) * 100) * 100,
                                px: s.image.desc.pixelCount,
                                chkSum: s.image.desc.pixelChkSum,
                            };
                        })
                    };
                    locations.push(loc);
                }
				
            });
            if (locations.length) {
				log("Saving aoids game rock layout  json for scene '" + sprites.sceneName + "' sprites ");
                const info = {
                    notes: [
                        "Created from scene  '" + sprites.sceneName + "'",
                        "Saved " + locations.length + " location sets"
                    ],
                    locations,
                };
                    
                downloadAsJson(info, "Rock_Locations_" + sprites.sceneName );                
                
            } else { log.warning("Nothing selected to export!") }
            
            
        }
	};


		
	
	
	
	return API;
	
})()