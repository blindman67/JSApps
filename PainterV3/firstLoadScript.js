"use strict";
const VERSION = "Groover 3";
//const SUB_VERSION = ".1.0"; 
const SUB_VERSION = ".2.0";   // 10/2023
document.title = "PainterV3" + SUB_VERSION;
var globalTime = 0;
var frameCount = 0;  // uSome functions are called from many places, this is used to ID a frame and make sure functions are not being called more times than needed
var globalEscape = false;
var globalRenderControl;
var logStack = [];
var logStackE = [];
var log1 = (...data) => {
    if(typeof log !== "undefined"){
        while(logStack.length){ log(logStack.shift()) }
        while(logStackE.length){ log.error(logStackE.shift()) }
        log(data);
        logStack = undefined;
        logStackE = undefined;
    }else{
        logStack.push(data);
    }
}
onerror = function(message, source, lineno, colno, error) {
    if(typeof log !== "undefined"){
        log.error("Uncaught error : " + message);
        log.error("In : " + source.split("/").pop() + " line : " + lineno + ", " + colno);
    }else{
        logStackE.push("Startup error : ");
        logStackE.push(message);
        logStackE.push("In : " + source.split("/").pop() + " line : " + lineno + ", " + colno);
    }
}
var unloadWarning = false;
addEventListener("beforeunload", (e) => {
    if (unloadWarning && sprites.length) {
        e.returnValue = "Leaving?";
        return "EXIT?";
    } 
    return;
});
const busy = (() => {
    const ids = new Map();
    var id = 0;
    const API = {
        count : 0,
        text : "",
        progress : null,
        isBusy: false,
        start(text){
            if(text === undefined){
                API.start.count += 1;
                API.start.isBusy = true;
                return;
            }
            API.start.count += 1;
            id++;
            ids.set(id, text);
            API.start.text = text;
            API.start.isBusy = true;
            return id;
        },
        end(busyId) {
            if(busyId === undefined){
                API.start.count = API.start.count < 2 ? 0 : API.start.count -1;
                API.start.isBusy = API.start.count > 0;
                API.start.progress = null;
                return;
            }
            ids.delete(busyId);
            if(ids.size > 0){
                API.start.text = [...ids.values()].pop();
                API.start.text = API.start.text === undefined ? "" : API.start.text;
            }else{
                API.start.text = "";
            }
            API.start.count = API.start.count < 2 ? 0 : API.start.count -1;
            if(API.start.count === 0) {
                API.start.text = "";
                API.start.progress = null;
                API.start.isBusy = false;
            } else {
                API.start.isBusy = true;
            }
        }
    }
    return Object.assign(API.start,API);;
})();
var AID = 1; // app id, this can have duplicates and be reused
var UID = 1000000; // Unique Id to session, must not be duplicated, must not be reused
var maxUID = 1000000;
const EMPTY_FUNCTION = function(){};
function getGUID(){  // Global unique to Painter  must not be duplicated, must not be reused
    var GUID = Number(localStorage[APPNAME + "_GUID"] ) + 1;
    localStorage[APPNAME + "_GUID"]  = GUID;
    return GUID;
}

const APP_LOCALS = Object.freeze({
    DEV: {
        ROOT: "//localhost/PainterV3",
        ROOT_REG: /https:\/\/localhost\/PainterV3\//gi,
        APP_NAME: "PainterV3",
        isLocation() { return document.location.href.includes("localhost/PainterV3") },
        LOCAL: true,
        MEDIA: "Downloads/",
    },
    LOCAL: {
        ROOT: "//localhost/JSApps/PainterV3",
        ROOT_REG: /https:\/\/localhost\/JSApps\/PainterV3\//gi,
        APP_NAME: "AppPainterV3",
        isLocation() { return document.location.href.includes("localhost/JSApps/PainterV3") },
        LOCAL: true,
        MEDIA: "Examples/",
    },
    GIT: {
        ROOT: "//blindman67.github.io/JSApps/PainterV3",
        ROOT_REG: /https:\/\/blindman67\.github\.io\/JSApps\/PainterV3\//gi,
        APP_NAME: "AppPainterV3",
        isLocation() { return document.location.href.includes("blindman67.github.io/JSApps/PainterV3") },
        LOCAL: false,
        MEDIA: "Examples/",
    },
});
const LOCALS = Object.values(APP_LOCALS).find(local => local.isLocation());
const APP_PROTOCOL = document.location.protocol;
const APPNAME            = LOCALS.APP_NAME;
const APP_ROOT_DIR_SHORT = APP_PROTOCOL + LOCALS.ROOT;
const APP_ROOT_DIR       = APP_PROTOCOL + LOCALS.ROOT + "/";
const APP_ROOT_DIR_REG   = LOCALS.ROOT_REG;
localStorage[APPNAME + "_GUID"] = localStorage[APPNAME + "_GUID"] ? localStorage[APPNAME + "_GUID"] : UID;
!LOCALS.LOCAL && (localStorage[APPNAME + "_settings"] = localStorage[APPNAME + "_settings"] ? localStorage[APPNAME + "_settings"] : '{"backgroundColor":"rgba(47,70,90,255)","widgetColor":"#0F0","highlightColor":"cyan","highlightSelFit":"#FF4","highlightSelLookat":"#44F","highlightSelAttach":"#4F4","highlightSelLinked":"#F44","highlightSelLocate":"#4FF","highlightSelAlign":"#F4F","highlightSelZorder":"#FF6","highlightSelSubSprite":"#F66","highlightSelInput":"#6F6","highlightSelOutput":"#FA6","selectedColor":"orange","showColor":"#888","cutterColor":"#555","snapOpenColor":"#F00","snapLockedColor":"#FF0","snapCrossSize":10,"cutterSize":256,"flashTime":200,"selectorColor":"#0A0","selectorDashSize":10,"spriteShowColor":"#888","spriteSelectedColor":"#F80","spriteCutterColor":"#888","spriteHighlightColor":"#0FF","onAnimationKeyColor":"#F00","functionLinkTextColor":"#FFF","functionLinkOutlineColor":"#8F8","shapeIconColor":"#F93","paintCaptureFrameRate":30,"paintCaptureBitRate":2000000,"videoCaptureBitRate":2000000,"sleepTime":"0","microSleepFrames":"0","sleepWakeFrames":15,"UI_Hide_Time":500,"drawSpacingGuid":false,"displayFont":"arial","textSpriteFont":"arial","textSpriteFontSize":"32","SVG_Export_Num_Size":2,"SVG_Export_Indent":4,"newSpriteLockScale":false,"newSpriteLockRotate":false,"gridSpriteDefaultSteps":8,"showMouseInfo":true,"nameOnCreate":true,"gridLineSnapDistance":8,"pixelSnap":"1","gizmoSnapsCorners":true,"gizmoSnapsMidEdge":false,"gizmoSnapsCenter":false,"focusOnNew":false,"dashSize":5,"dashAlpha":0.5,"dashLightColor":"white","dashDarkColor":"black","allow_HSL_Model":true,"wheelScaleRate":1.05,"wheelScaleResponse":0.7,"scaleRate":1.01,"recentCount":40,"allowUnsafe":false,"JPEG_Save_Quality":0.9,"downloadDir":"https://localhost/Downloads/","recent":["https://localhost/Downloads/imagerip_lhyuufdx.jpg","https://localhost/Downloads/canvas381913.png","https://localhost/Downloads/TilesGrassSandSea16By384679%20(1).png","https://localhost/MarkArmy_Store/GrassSandSea_tiles.png","https://localhost/Downloads/HeightMapDump.png","https://localhost/Downloads/minimapDump.png","https://localhost/Downloads/FlowMapPalDump.png","https://localhost/Downloads/FlowMapDump.png","https://localhost/Downloads/FOWMapDump.png","https://localhost/Downloads/gunMan_variation_1_Dump.png","https://localhost/Downloads/imagerip_lj3mm40n.jpg","https://localhost/Downloads/imagerip_lj8r18kw.jpg","https://localhost/Downloads/imagerip_ljm152t4.png","https://localhost/MarkArmy_Store/ArmyBases.png","https://localhost/Downloads/TileHome.png","https://localhost/Downloads/TileHome%20(1).png","https://localhost/Downloads/WallTilesShaded.png","https://localhost/Downloads/WallTiles.png","https://localhost/MarkArmy_Store/LandUseTiles.png","https://localhost/Downloads/TicTacToeRobot423593.png","https://localhost/Downloads/imagerip_lmtqif0y.jpg","https://localhost/Downloads/imagerip_lmwq5w0l.jpg","https://localhost/Downloads/IsoMorphicLand%20(1).png","https://localhost/Downloads/imagerip_lnazcqt1.jpg","https://localhost/Downloads/imagerip_lnb1cwxq.jpg","https://localhost/Downloads/imagerip_lnfk52ro.jpg","https://localhost/Downloads/imagerip_lnfj42m9.jpg","https://localhost/Downloads/imagerip_lnfj5g2h.jpg","https://localhost/Downloads/imagerip_lnfjhppn.jpg","https://localhost/Downloads/imagerip_lnfju7kv.jpeg","https://images.theconversation.com/files/380799/original/file-20210127-17-if809z.jpg?ixlib=rb-1.1.0&rect=0%2c0%2c5000%2c3330&q=20&auto=format&w=320&fit=clip&dpr=2&usm=12&cs=strip","https://localhost/Downloads/imagerip_lnfkmmya.jpg","https://localhost/Downloads/ImageRip_lnfju7kv.jpeg","https://localhost/Downloads/ImageRip_lnfjhppn.jpg","https://localhost/Downloads/ImageRip_lnfj42m9.jpg","https://localhost/Downloads/ImageRip_lnfj5g2h.jpg","https://localhost/Downloads/ImageRip_lnfk52ro.jpg","https://localhost/Downloads/ImageRip_lnfkmmya.jpg","https://localhost/Downloads/ImageRip_lns4257t.jpg","https://localhost/Downloads/imagerip_lns6he0g.jpg"],"saveGridState":true,"dynamicCompressor":true,"limitModify":false,"help":true,"animateGifOnLoad":false,"namePostFixDigits":2,"autoSpriteNamePrefix":false,"showInfoAlerts":true,"showWarnAlerts":true,"showErrorAlerts":true,"alertTime":20,"alertSize":10,"gridMix":"0.35","gridSize":"8","palletFormat":"Hex32","prettyJSON":true,"autoScrollSprite":true,"undoLevels":20,"imageExtraUndos":true,"autoSizeTimeline":true,"includeUnsavedImagesWhenSaving":true,"appendIdOnSave":false,"author":"Blindman67","copyright":"All content copyright Blindman67. All rights reserved. 2018","project":"Painter V3 Development","selectLoaded":false,"viewLoaded":false,"zoomOnLoadedOn":false,"addLoadedAsCollection":false,"localMedia":true,"maxAnimationLength":18000,"Render_U_I_Size":10,"mouseHangTime":5,"Key_HSL_Slide_Step":"16","storeOnPaintClose":true,"emojiIcons":true,"maxConvoluteSize":11,"infoPannelShowDelay":500,"useOffscreenCanvas":true,"maxImageDependencyRate":4,"timelineMaxTracks":"32","limitDrawTime":false,"maxDrawTime":10,"useDetailedNames":false,"J_I_T_Curves":false,"useGridWorkaround":false,"gridLineColor":"#000","gridColor1":"#CCC","gridColor2":"#999","gridColor3":"#666","gridColor4":"#333","keyColorSlideStep":4,"lightBox1Alpha":0.7,"lightBox2Alpha":0.6,"lightBox3Alpha":0.5,"lightBox4Alpha":0.45,"lightBox5Alpha":0.4,"lightBox6Alpha":0.35,"lightBox7Alpha":0.325,"lightBox8Alpha":"0.9","lightBox9Alpha":"0.8"}');
!LOCALS.LOCAL && (localStorage[APPNAME + "_Layout"]   = localStorage[APPNAME + "_Layout"]   ? localStorage[APPNAME + "_Layout"]   : '0.99, 0.001, 0, false');


const APP_SESSION_ID = getGUID();
function setUID(val) { UID = val }
function getUID(){ return UID++ }
const onceOnlyFlag = {};
const directortySearch = {
	found(idx) {
		if(idx > 1) {
			directories[0] = directories[idx]
			localStorage[APPNAME + "_searchDirectory"] = directories[0];
		}
	}
}
localStorage.MS_localDownloads = APP_ROOT_DIR + LOCALS.MEDIA;  // for other WEB apps on this domain to access the download directory.
const directories = [                                          // list of search URl when locating files by URL string
    localStorage[APPNAME + "_searchDirectory"] !== undefined ? localStorage[APPNAME + "_searchDirectory"] : APP_ROOT_DIR + "icons/",
    APP_ROOT_DIR + "icons/",
    APP_ROOT_DIR + "templates/",
    ...(LOCALS.LOCAL ? [
        APP_ROOT_DIR + "Aoids3Store/",
        APP_ROOT_DIR + "MarkArmy_Store/",
        APP_ROOT_DIR + "Mark2D_Store/",
    ] : [] ),
    APP_ROOT_DIR + LOCALS.MEDIA,
];


const NAMED_DIRECTORIES = {
    icons:      APP_ROOT_DIR + "icons/",
    templates:  APP_ROOT_DIR + "templates/",
    downloads:  APP_ROOT_DIR + "Downloads/",
    brushs:     APP_ROOT_DIR + "brushes/",
    aoids:      APP_ROOT_DIR + "Aoids3Store/",
};
const ICON_FROM = uni => String.fromCharCode(55357) + String.fromCharCode(uni);
const STYLE_WRAP_ICON_FROM = (uni, className) => `<span class="${className}">${ICON_FROM(uni)}</span>`;
const STYLE_WRAP_STR_FROM = (str, className) => `<span class="${className}">${str}</span>`;
const FUNCTION_LINK_OBJECT_EXTENSION = "FunctionLinkObj";
function createTextImage(data) {
    const img = new Image();
    img.src = "data:image/png;base64," + data;
    return img;
}
const textimages = {
    triangleRight: createTextImage("iVBORw0KGgoAAAANSUhEUgAAAAoAAAAPCAYAAADd/14OAAAASklEQVQoU2NkAIL/QMAIBCA2LgCWBCkE0fgUoyjEpxhDIS7FWBViU4xTIbpivAqRFRNUCFNMUCEsyCh3I3rgkx+OuKKR9LgmlHoAcAQ8EF2FHPwAAAAASUVORK5CYII="),
    triangleDown: createTextImage("iVBORw0KGgoAAAANSUhEUgAAABEAAAAPCAYAAAACsSQRAAAAVUlEQVQ4T+3ROQ4AIAgEQPj/o1UKEuRSCaXbKhNZERqCDQZ8xLbY18lYqf4SUni4AvH8ts4LJB9gOrmBJECbuMVmkAZChA48yANSREMRcEQYygC6MwFifyAQ2XpVVAAAAABJRU5ErkJggg=="),
};
const textIcons = {};
const unicodeIcons = {
    emojis: false,
    triangleRight:  "\u25BA",
    triangleLeft:   "\u25C4",
    triangleUp:     "\u25B2",
    triangleDown:   "\u25BC",
    lookat:         "\ud83d\udc40",
    tickBox:        "\u2714",
    tickBoxOff:     "\u2610",
    captureOn:      "\ud83d\udcf7",
    grouped:         "\u2442",
    ungrouped:       "\u2443",
    delete:         STYLE_WRAP_STR_FROM("\u274C","textRed"),
	speakerOn:         "\uD83D\uDD0A",
    undoCircle:       "\u21BA",
}
const emojiIcons = {
    emojis: true,
    drawable:          ICON_FROM(56541), // paper and pen
    splash:            ICON_FROM(56486), // 3 drop of water
    triangleRight:     "+",             //ICON_FROM(57218),
    triangleLeft:      ICON_FROM(57216),
    triangleUp:        ICON_FROM(57217),
    triangleDown:      "| ",                //ICON_FROM(57219),
    save:              ICON_FROM(56510), // old disk
    saveDVD:           ICON_FROM(56509), // old DVD
    delete: STYLE_WRAP_ICON_FROM(57260,"textRed"), // cross
    list:              ICON_FROM(56529),
    pattern:           ICON_FROM(56482),
    tickBox:           ICON_FROM(56825),
    tickBoxOff:        ICON_FROM(56823),
    fire:              ICON_FROM(56613),
    locked:            ICON_FROM(56594),
    unlocked:          ICON_FROM(56595),
    keyBoxSmall:       ICON_FROM(57236),
    keyBoxBig:         ICON_FROM(57237),
    keyBox:            ICON_FROM(57238),
    X:                 ICON_FROM(57259),
    XX:                ICON_FROM(57260),
    XXX:               ICON_FROM(57262),
    emotQuizzical:     ICON_FROM(56853),
    emotConstination:  ICON_FROM(56876),
    emotHappy:         ICON_FROM(56832),
    emotNotGood:       ICON_FROM(56848),
    emotRoll:          ICON_FROM(56900),
    functionMounted:   ICON_FROM(56480),
    captureOn:         ICON_FROM(56568),
    lookat:            ICON_FROM(56384),
    inDraw:            ICON_FROM(56549),
    outDraw:           ICON_FROM(56548),
    video:             ICON_FROM(56572),
    pallet:            "\u{1F3A8}",
    pen:               "\u2712\ufe0f",
    hammerSpanner :    "\ud83d\udee0\ufe0f",
    flag:              "\ud83d\udea9",
    link:              "\ud83d\udd17",
    paperClip:         "\ud83d\udcce",
    dimond:            "\ud83d\udc8e",
    vector:            "\ud83d\udc8e",
    film:              "\ud83c\udfa6",
    sleep:             "\ud83d\udca4", // Zz
    view:              "\ud83d\udc53",  // glasses
    snapSprite:        "\ud83d\udcd0", // triangle
    ungrouped:         "\ud83d\udc64",
    grouped:           "\ud83d\udc65",
    saveAll:           "\ud83d\udcda",
	sprite:            "\ud83d\udc7b",
	speakerOn:         "\uD83D\uDD0A",
    running:           "\u26F9",
    outbox:            "\u{1F4E4}",
    inbox:             "\u{1F4E5}",
    magnifyingGlass:   "\u{1F50D}",
    keyboard:          "\u2328",
    undoCircle:        "\u21BA",
    strToMath(str) {
        var s = "";
        const sup = "\u2070\u2071²³\u2074\u2075\u2076\u2077\u2078\u2079";
        const sub = "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089";
        var inSup = false;
        var inSub = false;
        str = str.replace(/#ang/gi,"\u2222"); // ang
        str = str.replace(/#rt2/gi,"\u221A"); // root 2
        str = str.replace(/#rt3/gi,"\u221B"); // root 3
        str = str.replace(/#rt4/gi,"\u221C"); // root 4
        str = str.replace(/#pi/gi, "\u03C0"); // pi
        str = str.replace(/#fta/gi,"\u03B8"); // theta
        for(const char of str) {
            if(inSup) {
                if(/[0-9]/.test(char)) {
                    if(char === "2") { s+= String.fromCharCode(178) }
                    else if(char === "3") { s+= String.fromCharCode(179) }
                    else { s += sup[char] }
                }else {
                    inSup = false;
                    s += char;
                }
            } else if(inSub) {
                 if(/[0-9]/.test(char)) {
                    s += sub[char];
                }else {
                    inSub = false;
                    s += char;
                }
            } else if(char === "^") {
            } else if(char === "^") {
                inSup = true;
                inSub = false;
            } else if(char === "`") {
                inSup = false;
                inSub = true;
            } else {
                s += char;
            }
        }
        return s;
    },
};
Object.assign(textIcons, emojiIcons);
function setTextIcons() {
    if (settings.emojiIcons && textIcons.emojis !== true) {
        //Object.assign(textIcons, emojiIcons);
		Object.assign(textIcons, unicodeIcons);
    } else {
        Object.assign(textIcons, unicodeIcons);
    }
}
var microSleepFrames = 0;
const glFilters = {
    dependents : [
        "proceduralBase.js",
    ],
    filters : [
        "HSLCurves.js",
        "warp.js",
        "testFilter.js",
        "proceduralFilters.js",
        "lighting.js",
		//"webGL2Filters.js",
    ],
    named : {
		/*webGL2_Paint : [
			["webGL2","paintFilter"],
			["webGL2","paintFilter1"],
			["webGL2","paintFilter2"],
			["webGL2","paintFilterA"],
			["webGL2","paintFX"],
			["webGL2","paintPolys"],
		],*/
		/*webGL2_Filters : [
		],*/
        lighting : [
            /*"omniLight",
            "omniLightHeight",
            "directionalPixelLight",*/
			"stratify",
            "heightErode",
            "heightErodeRiver",
            //"heightErodeRiver2",
			"occlutionHeight",
			"normMapReflect",
			"omniLightNormMap",
            "omniLightFlat",
            "omniLightTube",
            "omniLightSphere",
        ],
        HSL_Filters : [
            "HSL_Curves",
            "HSL_Filters",
			"RGB_2_HSL_Exchange",
            "HSL_Targeted",
            "HSL_CycTargeted",
        ],
        blurSharpen : [
            "pinSharp",
            "boxBlur",
            "gBlur",
            "denoise",
            "Unsharpen",
            "CustomConvolute",
        ],
        experimental : [
            "edgeDetect",
            "edgeDetectTripple",
            "reduceNoise",
            "simpleFilters",
            "pixelErode",
            "shadow",
            "pointClean",
            "monoTailRemove",
            "monoPixelRemove",
            "variance",
            "oneBitNoise",
            "addNoise",
            "colorNoise",
            "colorNoiseByValue",
            "multiplyNoise",
        ],
        distorto : [
            "mirror",
            "kalidascope",
            "linearTaper",
            "skew",
            "displaceRepeat",
            "displace",
            "lensUndistortPlane",
            "lensUndistort",
            "deconverge",
            "deconvergeLinear",
            "spheroid",
            "warp",
            "unwrapCylinder",
        ],
        colorsAndChannels : [
            "channels",
            "curves",
            "rangeCurves",
            "contrast",
            "Overdrive",
            "clamp",
            "Vignette",
            "ACES_Film",
            "Invert",
            "WhiteBalance",
            "Temperature",
            "tintFilter",
            "BlackAndWhite",
            "twoTone",
            "alphaFilters",
            "channelCopy",
            "chromaKey",
        ],
        misc : [
            //"testFilter",
            "imageEdgeFeather",
			"pixelOutline",
			/* "pixelOutline2", */
            "colorReplace",
            "emboss",
            /* "imageOutline", */
            /* "directionalOutline", */
            //"Sobel",
            "GradientMixing",
        ]
    },
};
const namedGLFilters = ["?"]; // for commaqnd line auto complete
(()=> {
	const dStyles = dinamicStyleElement.sheet;
	var h = 220;
	const step = 20;
	for(const name of Object.keys(glFilters.named)) {
        namedGLFilters.push(...glFilters.named[name]);
		const sel = ".extrasWGL_F" + name +" .";
		dStyles.insertRule(sel + "foldItem { background: hsl("+ h +", 22%, 39%); }")
		dStyles.insertRule(sel + "listItem { background: hsl("+ h +", 24%, 32%); }");
		dStyles.insertRule(sel + "foldItem:hover { background: hsl("+ h +", 18%, 45%); }");
		dStyles.insertRule(sel + "listItem:hover { background: hsl("+ h +", 60%, 20%); }");
		h += step;
		h = h % 360;
	}
})();
const CanDo = {
    paintRecorder: false,
    clipboard: false,
    clipboardHasImage: false,
    clipboardHasText: false,
    async check() {
        const permission = await navigator.permissions.query({ name: 'clipboard-read' });
        CanDo.clipboard = permission.state !== 'denied';
        if (CanDo.clipboard) {
            CanDo.checkClipboardContent = (hasImage, hasText) => {
                navigator.clipboard.read().then(content => {
                    CanDo.clipboardHasText = false;
                    CanDo.clipboardHasImage = false;
                    for (const item of content) {
                        if (item.types.includes("text/plain")) { CanDo.clipboardHasText = true; }
                        if (item.types.includes("image/png")) { CanDo.clipboardHasImage = true; }
                    }
                    if (hasText && CanDo.clipboardHasText) { hasText(); }
                    if (hasImage && CanDo.clipboardHasImage) { hasImage(); }
                });
            }
        } else {
            CanDo.checkClipboardContent = () => { CanDo.clipboardHasText = CanDo.clipboardHasImage = false; }
        }
    }
};
CanDo.check();
const DISABLE_PAINT_RECORDER = !CanDo.paintRecorder;
const unsafeMessage = "Some functions will taint the canvas and are thus turned off.\nYou can turn off browser security and activate unsafe functions\nusing the command safe.";
const settings = {
    backgroundColor: "#ffffff",
    widgetColor: "#0F0",
    highlightColor: "cyan",        // When highlighting a sprite
    highlightSelFit: "#FF4",
    highlightSelLookat: "#44F",
    highlightSelAttach: "#4F4",
    highlightSelLinked: "#F44",
    highlightSelLocate: "#4FF",
    highlightSelAlign: "#F4F",
    highlightSelZorder: "#FF6",
    highlightSelSubSprite: "#F66",
    highlightSelInput: "#6F6",
    highlightSelOutput: "#FA6",
    selectedColor: "orange",       // outlines select sprites with this colour
    showColor: "#888",             // The colour of the sprite outline (just visible auto set alpha 0.5
    cutterColor: "#555",           // color of cutter grid (also default sprite color
    snapOpenColor: "#F00",
    snapLockedColor: "#FF0",
    snapCrossSize: 10,
    cutterSize: 256,               // in px the defualt size of a cutter
    flashTime: 200,                // in ms. Logger has a eye catcher. This is the length of time the change is on for.
    selectorColor: "#0A0",
    selectorDashSize: 10,
    spriteShowColor: "#888",
    spriteSelectedColor: "#F80",
    spriteCutterColor: "#888",
    spriteHighlightColor: "#0FF",
    //gridLineColor: "#000",         // grid lines use for snap mode 1
    onAnimationKeyColor: "#F00",
    functionLinkTextColor: "#FFF",
    functionLinkOutlineColor: "#8F8",
    shapeIconColor: "#F93",
    audioLevelColor: "#08F",
    paintCaptureFrameRate: 30,
    paintCaptureBitRate: 2000000,
    videoCaptureBitRate: 2000000,
    sleepTime: 120,
    microSleepFrames: 2,
    sleepWakeFrames: 15,
    UI_Hide_Time: 500,
    drawSpacingGuid: false,
    displayFont: "arial",//"Lucida Console",
    textSpriteFont: "arial",
    textSpriteFontSize: 32,
    SVG_Export_Num_Size: 2,
    SVG_Export_Indent: 4,
    newSpriteLockScale: true,
    newSpriteLockRotate: true,
    gridSpriteDefaultSteps: 8,
    smallLockIndicator: true,
   // renderUISize: 10,
	showMouseInfo: true,            // Shows live info on mouse position and selected sprite
    nameOnCreate: true,
    gridLineSnapDistance: 8,       // Pixel distance that snap mode 1 will snap to
    pixelSnap: 8,                  //
    gizmoSnapsCorners: true,
    gizmoSnapsMidEdge: false,
    gizmoSnapsCenter: false,
    focusOnNew: false,             // If true workspace is moved to center the new sprite object.
    dashSize: 5,                   // in pixels
    dashAlpha: 0.5,
    dashLightColor: "white",
    dashDarkColor: "black",
    allow_HSL_Model: true,
    wheelScaleRate: 1.05,          // was 1.05  // Value is a multiplier. Reverse by  1 over ?
    wheelScaleResponse: 0.7,       // Amount of time one wheel step scales for. Value MUST be < 1 and >= 0
    scaleRate: 1.01,               // was 1.05
    recentCount: 40,               // number of media files to keep in recent media list
    allowUnsafe: false,            // if true then allows draw functions that taint the canvas.
    JPEG_Save_Quality: 0.9,          // Used when saving images as jpg. Valid range 0 to 1 with 1 being best quality.
    downloadDir: APP_ROOT_DIR + "Downloads/",
    recent: [],
    saveGridState: true,
	dynamicCompressor: true,
    limitModify: false,
    help: true,                    // If true then tool tips contain button help.
    animateGifOnLoad: true,        // If true animation is created when gif has loaded
    namePostFixDigits: 2,          // Duplicated names are postfixed a number. This sets how many digits are padded with 0
	autoSpriteNamePrefix: false,    // when true  make sprite names unique by appending a number
    showInfoAlerts: true,         // Add eye catching arrow to push attention to the log for infomation content
    showWarnAlerts: true,          // Add eye catching arrow to push attention to the log for warning content
    showErrorAlerts: true,         // Add eye catching arrow to push attention to the log for errors content
    alertTime: 20,                 // in frames. Time that alerts is displayed
    alertSize: 10,                 // in pixels the base size of the alert (arrow head is 4 * this value wide)
    /*gridColor1: "#CCC",            // Color 1 of grid pattern 1
    gridColor2: "#999",            // Color 2 of grid pattern 1
    gridColor3: "#666",            // Color 1 of grid pattern 2
    gridColor4: "#333",            // Color 2 of grid pattern 2*/
    gridMix: 0.3,
    gridSize: 8,
    palletFormat: "compressed", 
    prettyJSON: true,
    autoScrollSprite: true,
    undoLevels: 20,
    imageExtraUndos: true,
    Image_J_I_T_Undo: true,
    debugUndos: true,
    autoSizeTimeline: true,
    includeUnsavedImagesWhenSaving: true,
    appendIdOnSave: false,
    author: "Blindman67",
    copyright: "All content copyright Blindman67. All rights reserved. 2022",
    project: "Painter V3 Development",
    selectLoaded: true,
    viewLoaded: true,
    zoomOnLoadedOn: false,
    addLoadedAsCollection: false,
    localMedia: true,
    maxAnimationLength: 5 * 60 * 60,
    Render_U_I_Size: 10,
    mouseHangTime:5,
    Key_HSL_Slide_Step: 4,
    storeOnPaintClose: true,
    emojiIcons: true,
    maxConvoluteSize: 11,
    infoPannelShowDelay: 500, // in ms
    useOffscreenCanvas: false,
    maxImageDependencyRate: 4,
    timelineMaxTracks: 32,
    usePointer : true,
    showPenLocationGuide: true,
    // Current experimental settings.
    limitDrawTime: false,          // This option is currently ignored as with maxDrawTime. Avalible only with experimental versions of Painter3
    maxDrawTime: 10,               // in ms. Some draw functions can be slow. This sets the max time a draw function can have befor exiting the function
                                    // This prevents the function from blocking mouse input.
    useDetailedNames: false,       // When true displayed names will include additional info regarding the object
                                    // This is mainly used to help development and may be removed at any time.
    J_I_T_Curves: false,           // Compound (mixed) curves are Compiled as needed to improve performance.
                                    // Intended as Painter Pro feature and requiers JITCurves.js (Note yet written)
}
if(localStorage[APPNAME + "_settings"]) {
    Object.assign(settings, JSON.parse(localStorage[APPNAME + "_settings"]));
}
const settingsHandler = {
    saveSettings() {
		try {
			localStorage[APPNAME + "_settings"] = JSON.stringify(settings);
		} catch(e) {
			log.error("COULD NOT SAVE settings.");
			log.error("Error: '" + e.message + "'");
		}
	},
    onChangeList : [],
    set onchange(value){
        if(typeof value === "function"){
            settingsHandler.onChangeList.push(value);
        }
    },
    updateTokenValues() {
        for (const [key, val] of Object.entries(settingsHandler.settingsTokenOptions)) {
            var tokenStr = settings[key].toLowerCase().trim().split(" ")[0];
            var i = 0;
            var found = false;
            while (i < val.length) {
                if (val[i].toLowerCase() === tokenStr) {
                    found = true;
                    settings[key] = val[i];
                    break;
                }
                i++;
            }
            if (!found) {
                settings[key] = val[0];
            }
        }
    },
    updateSettings() {
        settingsHandler.updateTokenValues();
        for(const cb of  settingsHandler.onChangeList){ cb() }
        settingsHandler.saveSettings();
    },
    settingsShadow  : {...settings},
    getSettingDesc(name) {
        const desc = settingsHandler.settingsDescriptive;
        name = name.toLowerCase();
        for (const val of Object.values(desc)) {
            for (const key of Object.keys(val)) {
                if (key.toLowerCase() === name) {
                    return val[key];
                }
            }
        }
        return "";
    },
    saveSettingAsJson(name = "PainterV3_settings", includeDesc = false) {
        if (includeDesc) {
            const copy = {};
            for (const [key, val] of Object.entries(settings)) {
                const desc = settingsHandler.getSettingDesc(key);
                if (desc !== "") {
                    copy["Desc_" + key] = desc;
                }
                copy[key] = val;
            }
            storage.saveJSON(copy, name, "settings", "Items prefixed with 'Desc_' will not be loaded by Painter");
        } else {
            storage.saveJSON(settings, name, "settings");
        }
    },
    fromObj(obj) {
        for (const key of Object.keys(settings)) {
            if (obj[key] !== undefined) {
                settings[key] = obj[key];
            }
        }
        settingsHandler.updateSettings();
    },
    settingsTokenOptions: {
        palletFormat: ["Compressed","CSSHex","Hex32"],
    },
    settingsMenuItems: {},
    settingsDescriptive: {
        colors : {
            audioLevelColor: "Color of audio sprite levels line widget",
            backgroundColor : "Background colour",
            widgetColor : "Colour of sprite wiget",
            highlightColor : "When highlighting a sprite",
            highlightSelFit : "Colour to highlight sprites when selecting to fit",
            highlightSelLookat : "Colour to highlight sprites when selecting Lookat",
            highlightSelAttach : "Colour to highlight sprites when selecting Attach",
            highlightSelLinked : "Colour to highlight sprites when selecting Linked",
            highlightSelLocate : "Colour to highlight sprites when selecting Locator",
            highlightSelAlign : "Colour to highlight sprites when selecting Alignments",
            highlightSelZorder : "Colour to highlight sprites when selecting Z-order position",
			highlightSelSubSprite: "Colour to highlight sprites when selecting Sub Sprite index",
            highlightSelInput: "Colour for input of function links",
            highlightSelOutput: "Colour for output of function links",
            selectedColor : "outlines select sprites with this colour",
            functionLinkTextColor: "Colour of function link text\nYou can overwrite by setting the sprite second colour",
            functionLinkOutlineColor: "Colour of function link outline\nYou can overwrite by setting the sprite first colour",
            shapeIconColor: "Compound shapes display an icon so that they can be located visualy in the workspace",
            showColor : "The colour of the sprite outline (just visible auto set alpha 0.5",
            cutterColor : "Color of cutter grid (also default sprite color)",
            selectorColor : "Colour of sprite selection box",
            snapOpenColor : "Color of drawing snaps when not locked",
            snapLockedColor : "Color of drawing snaps when locked",
            onAnimationKeyColor : "Colour of sprite when animation time is at a key frame.",
            spriteShowColor : "Colour of sprites",
            spriteSelectedColor : "Colour of selected sprites",
            spriteCutterColor : "Default colour of cutter type sprites",
            spriteHighlightColor : "Colour of highlighted sprite when selecting a sprite",
            dashLightColor : "Colour of line helpers bright dash",
            dashDarkColor :  "Colour of line helpers dark dash",
            /*gridLineColor : "grid lines use for snap mode 1",
            gridColor1 : "Color 1 of grid pattern 1",
            gridColor2 : "Color 2 of grid pattern 1",
            gridColor3 : "Color 1 of grid pattern 2",
            gridColor4 : "Color 2 of grid pattern 2",*/
        },
        UI_ : {
            undoLevels: "Number of undo levels. Max value 100",
            limitModify:  "When in modif mode and timeline open only modify selected tracks",
            flashTime : "Time in ms. Logger has a attention catcher. This is the length of time the change is on for",
            focusOnNew : "If true workspace is moved to center the new sprite object",
            nameOnCreate : "Automaticly rename new sprites via user input",
            wheelScaleRate : "Value is a multiplier. Reverse by  1 over ?",
            wheelScaleResponse : "Amount of time one wheel step scales for. Value MUST be < 1 and >= 0",
            scaleRate : ""  ,
            usePointer : "When using touch devices if this\n is true input is via the Pointer API\nRequiers restart.",
            gridLineSnapDistance : "Pixel distance that snap mode 1 will snap to",
            gridMix: "Alpha value of grid overlay. Values  0 <= gridMix <= 1",
            gridSize: "Size of one grid unit. Values 4 <= gridSize <= 32",
            pixelSnap : "Whole number representing Min pixel snap size",
            gizmoSnapsCorners: "Use and show gizom corners when snapping",
            gizmoSnapsMidEdge: "Use and show gizom edge mid points when snapping",
            gizmoSnapsCenter: "Use and show gizom center when snapping",
			showMouseInfo : "When true displays info about mouse and selected sprite.",
            help : "If true then tool tips contain button help.",
            showInfoAlerts : "Add attention catching arrow to push attention to the log for infomation content",
            showWarnAlerts : "Add attention catching arrow to push attention to the log for warning content",
            showErrorAlerts : "Add attention catching arrow to push attention to the log for errors content",
            alertTime : "in frames. Time that alerts is displayed",
            alertSize : "in pixels the base size of the alert (arrow head is 4 * this value wide)",
            selectorDashSize : "Length of line dash for sprite selection box",
            recentCount : "Number of media files to keep in recent media list",
            dashSize : "Line helpers dash size in pixels",
            dashAlpha : "Line helpers dashed line alpha",
            autoScrollSprite: "When true automiticly scrolls selected sprite into view in sprite tab",
            autoSizeTimeline : "Timeline sizes to fit content.",
            timelineMaxTracks: "Max number of tracks displayed in timeline.",
            Render_U_I_Size : "Size of rendering UI markers.",
            snapCrossSize : "Size of snap crosses when drawing",
            emojiIcons: "Uses Emoji Icons. Not avalible on some OS's. Turn off to use Unicode icons",
            infoPannelShowDelay: "Delay time in ms to show info pannel",
            UI_Hide_Time: "Time delay when moving over workspace to delay hiding UI\nWhen UI hidden",
            mouseHangTime : "Number of frames to allow mouse to hang\nIf the page is block for longer the mouse buttons are\nreleased at the last position",
            Key_HSL_Slide_Step : "Distance to move color sliders via keyboard shortcuts",
            drawSpacingGuid: "Draws 3d spacing guids for perspective grids",
            displayFont: "Font used to render to the workspace",
            selectLoaded: "When true loaded content is selected on load",
            viewLoaded: "When true loaded content is centered to workspace",
            zoomOnLoadedOn: "When true and view loaded is true loaded content is zoomed to fit workspace",
            addLoadedAsCollection: "When true loaded content is added as a collection given the name of the file",
            smallLockIndicator: "When true the image locked (progress) graphic is reduced in size and not over the sprite",
            showPenLocationGuide: "Drawing feedback. If true draw dashed lines to help locate cursor position.",
        },
        sprites: {
            newSpriteLockScale: "If true new sprites have scale locked by default",
            newSpriteLockRotate: "If true new sprites have rotate locked by default",
            gridSpriteDefaultSteps: "Number of grid steps to default to when creatin grid sprites",
            textSpriteFont: "Default font to use when creating text sprites",
            textSpriteFontSize: "Base size in pixel of text sprite.\nWarning text is scaled from this base size,\nsetting this value too small can result in poor quality text.",
        },
        misc : {
            useOffscreenCanvas: "If true uses OffscreenCanvas Object. Set to false when using Firefox",
            allow_HSL_Model : "Override HSL color model blocking optimisations\nHSL color model can have a negative performance in some situations\nWhen using random colors the HSL model is deactivated automaticly",
            palletFormat: "Format used to save pallet sprites. Options are\n'Compressed' minimum hex string RRGGBB. This is the default\n'CSShex' comma delimited CSS string #RRGGBB,\n'Hex32' comma delimited code hex literal 0xFFBBGGRR\n where alpha is fixed to 255",
            prettyJSON: "When true JSON outputs have new lines and are indented.\nElse all formating is removed.",
            cutterSize : "In px the defualt size of a cutter",
            saveGridState: "When true current Grid state is saved with scene",
            allowUnsafe : "If true then allows draw functions that taint the canvas.",
            JPEG_Save_Quality : "Used when saving images as jpg. Valid range 0 to 1 with 1 being best quality.",
            includeUnsavedImagesWhenSaving: "When true unsaved images are stored as dataURLs in the sprite save file",
            namePostFixDigits : "Duplicated names are postfixed a number. This sets how many digits are padded with 0",
			autoSpriteNamePrefix: "When true names are made unique by appending a number\nName do not have to be unique. Loaded scenes can contain duplicated names.",
            animateGifOnLoad : " If true animation is created when gif has loaded",
            localMedia : "Check to provide access to local media (eg web cam).\nAccess will require your permission.",
            maxAnimationLength : "Max length in frames (60FPS) of animation\nLower end systems may have problems with long animations",
            paintCaptureFrameRate : "Frame rate of paint video capture",
            paintCaptureBitRate : "Bit rate of paint video capture",
            videoCaptureBitRate : "Bit rate of video capture",
			microSleepFrames: "Number of frames after user input to wait before blocking render loop\nUse this when very low power or have CPU/GPU heating problems.\nWARNING!! when active some functionality is lost\n0 to prevent micro sleep",
            sleepTime: "Number of frames of inactivity to enter low power mode.\n0 to turn off",
            sleepWakeFrames: "Number of frames of mouse activity to wake from low power mode",
            //SVGExportNumSize: "Number of decimal points use when exporting SVG coordinates",
            SVG_Export_Num_Size: "Number of decimal points use when exporting SVG coordinates",
            SVG_Export_Indent: "Number of spaces to use when indenting exported SVG",
            maxConvoluteSize: "WebGL filters maximum convolution matrix size\nLarge matrix can crash some GPUs this limit\nprevent accedental setting matrix too large\nREQUIERS restart",
            maxImageDependencyRate: "Limits frame rate for image dependency calls",
			dynamicCompressor: "When playing audio the compressor reduces distorsion when mixing sounds",

        },
        personalise : {
            appendIdOnSave: "When true downloaded scenes as saved with UID to make the filename unique",
            author : "This informations added to any PainterV3 file types.",
            copyright : "This informations added to any PainterV3 file types.",
            project : "Project information",
            downloadDir: "When using with Image Zoom extension and running on local host",
        },
        experimental : {
            imageExtraUndos: "If true use experimental undos for images.",
            Image_J_I_T_Undo: "If true image undo buffers are optimised.",
            debugUndos: "If true shows addition media information regarding Undo buffers in media list.",
            storeOnPaintClose: "If on image content is safely stored in RAM so it can be recoved if GPU context is lost.",
            limitDrawTime : "This option is currently ignored as with maxDrawTime. Avalible only with experimental versions of Painter3",
            maxDrawTime : "Time in ms. Some draw functions can be slow. This sets the max time a draw function can have befor exiting the function\nThis prevents the function from blocking mouse input.",
            useDetailedNames :"When true displayed names will include additional info regarding the object\nThis is mainly used to help development and may be removed at any time.",
            J_I_T_Curves : "When true, curves are compiled as needed\nThis will improve drawing time\nONLY for Painter V3 Pro\n",
        }
    }
}
function getGlobalSettings(){
	microSleepFrames = isNaN(settings.microSleepFrames) ? 0 : Number(settings.microSleepFrames);
    SVGDig = settings.SVG_Export_Num_Size;
    SVGForNum = new RegExp("(\\.0{"+SVGDig+"}|0{1,"+SVGDig+"})$","g");
    SVGIndent = ("").padStart(settings.SVG_Export_Indent," ");
    setTextIcons();
}
var SVGDig = 2, SVGIndent = "    ", SVGForNum;
getGlobalSettings();
settingsHandler.onchange = getGlobalSettings;



