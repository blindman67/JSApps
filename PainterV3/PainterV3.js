const settingsSetup = [
    () => { setTimeout(() => mainCanvas.ctx.setBackgroundColor(settings.backgroundColor), 1) },
    () => { setTimeout(() => webGLFilterMenus.loadGLFilters(), 500) },
    () => { setTimeout(() => pens.firstRun(), 2) },
    () => { setTimeout(() => { if(settings.localMedia) {  media.getMediaDeviceList()}}, 50) },
    () => { setTimeout(() => initDevice(), 50) },
    () => { setTimeout(() => functionLinkBuilder.start(), 5) },
    //() => { setTimeout(() => TestApp(), 1005) },

];
settingsHandler.onchange = () => { setTimeout(()=>mainCanvas.ctx.setBackgroundColor(settings.backgroundColor),10) };
function saveSettings() { localStorage[APPNAME + "_settings"] = JSON.stringify(settings); }

const deviceInfo = {
    inputCaps: /*window.InputDeviceCapabilities ? new InputDeviceCapabilities() :*/ {inputCaps: {firesTouchEvents: false}},
};
function initDevice() {
        deviceInfo.inputCaps.firesTouchEvents = true;
    //mouse.listen();
    deviceInfo.inputCaps?.firesTouchEvents ? startTouch() : mouse.listen();
    showDeviceInfo();
}
function showDeviceInfo() {
    if (deviceInfo.inputCaps?.firesTouchEvents) {
        log.info("Detected touch device.");
    } else {
        log.info("Detected mouse device.");
    }
}
/*
function TestApp() {
    log.info("Test app called.");
    if ("launchQueue" in window) {
        window.launchQueue.setConsumer((launchParams) => {
            if (launchParams.files && launchParams.files.length) {
                var idx = 0;
                while (idx < launchParams.files.length) {
                    const file = launchParams.files[idx];
                    log(file.kind);
                    log(file.name);
                    idx++;
                }
            }
            
        });
    }

    
}*/

function addLoadedMedia(name){
    settings.recent = settings.recent.filter(n => n !== name);
    settings.recent.push(name);
    if (settings.recent.length > settings.recentCount) { settings.recent.shift(); }
    settingsHandler.saveSettings();
}
const DM = new DropManager( "mainCanvas"); /*,
    (file) => {
        if (file) {
            if (typeof file === "string") { file = {name: file} }
            if (file.name.indexOf(".json") === file.name.length -5) {
                storage.loadJSON(file.name)
                    .then(()=>{})
                    .catch(e=> { log.warn("Could not load file " + file.name); log.warn("Error : " + e.status); });
            } else {
                media.create(file.name, (image) => {
                    if (!image) { log.error("Could not load media."); }
                })
            }
        } else { log.error("Unknown file type."); }
    },
    ["*"]
);*/
const fileList = (()=>{
    var fileList = localStorage[APPNAME + "_fileList"] ;
    if (fileList === undefined) {
        fileList = [];
        localStorage[APPNAME + "_fileList"]  = JSON.stringify(fileList);
    } else { fileList = JSON.parse(fileList); }
    return {
        list() {
            fileList.forEach(filename => { log(filename.split("__")[0]); });
        },
        add(filename){
            name = filename.split("__")[0];
            fileList = fileList.filter(fName => fName.split("__")[0] !== name)
            fileList.push(filename);
            localStorage[APPNAME + "_fileList"]  = JSON.stringify(fileList);
        },
        getFilename(name){
            for (const fName of fileList) {
                if (fName.split("__")[0] === name) { return fName; }
            }
            return undefined;
        }
    };
})();
const loadGLFilters = (()=>{
    var time = 500;
    function loadGLFilters() {
        if (typeof filterGL !== "undefined") {
            log.info("WebGL filters ready to load");
            glFilters.forEach(filterFile => {
                console.log("webGLFilters/"+filterFile);
                const filterScript = $("script",{src : "webGLFilters/"+filterFile});
                filterScript.addEventListener("load", event => {
                    log("Loaded filter '"+ filterFile+"'");
                })
                $$(filterScript);
            });
        } else {
            if (time > 2000) { log.warn("There is a problem loading webGL filters"); }
            else { log.info("waiting for webGL filters to load" + time); }
            setTimeout(loadGLFilters,time);
            time += 500;
        }
    }
    return loadGLFilters;
})();
setTimeout(()=>{
        [ "Wellcome to Paint Groover V3", "Type help or ? to get more info on using the command line",
        ].forEach(v=>log.sys(v));
        settingsSetup.forEach(setup => setup());
        mainCanvas.ctx = render();
        issueCommand(commands.edSprResetView);
        if (logStackE.length > 0){
            log1("");
            log.warn("Somethiing is not quite right " + textIcons.emotQuizzical + " ");
            log.warn("However painter may still be usable.");
            log.warn("If you have problems try reloading the page.");
        } else if(logStack.length > 0) {
            log1("");
            log.warn("Unexpected startup event may need attention " + texticons.emotNotGood);

        } else {
            log1("");
            log.sys("All loaded and ready to be groovey " + textIcons.emotHappy);
        }
        busy.end();
    },
    10
);
