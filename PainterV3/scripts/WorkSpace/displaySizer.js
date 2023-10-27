const displaySizer = (()=>{
    const id = UID ++;
    const timelineMaxTracks = settings.timelineMaxTracks;
    const setup = {
        minRightSize : 25*16+4,
        minRightHeight : 25,
        minTimeHeight : timelineMaxTracks * 16 + 48,
        useCanvas : false,
    }
    function getSettings(){
        UIHideTime = settings.UI_Hide_Time;
    }
    var firstUpdate = true;
    var UIHideTime;
    getSettings();
    settingsHandler.onchange = getSettings;
    var W = innerWidth;
    var H = innerHeight;
    var onafterupdate;
    var vertSplit = W - 400;
    var horSplit = H / 2 | 0;
    var horTimeSplit = H - 400;
    var oldInnerWidth  = W;
    var oldInnerHeight  = H;
    var hidingFullUI = false;  // Should only be true if hidingUI is true
    var hidingUI = false;
    var hidingUITime = false;
    var timeWinState;
    var timeWinPos = 0;
    var timeoutHdl;
    var currentBar;
    var dragging = false;
    var lastMouse = {x : 0, y : 0};

    function saveState(){
        if(onafterupdate) { onafterupdate({vertSplit,horSplit,horTimeSplit}) }
        localStorage[APPNAME + "_Layout"]  = (vertSplit /oldInnerWidth) + ", " + (horSplit /oldInnerHeight)+", " + (horTimeSplit /oldInnerHeight) + ", " + timeWin.active;
    }
    function getSavedState() {

        if(localStorage[APPNAME + "_Layout"]){
            const [x,y,z, timeWinActive] =  localStorage[APPNAME + "_Layout"].split(", ");
            vertSplit = W * Number(x) | 0;
            horSplit = H * Number(y) | 0;
            horSplit = setup.minRightHeight;
            if (timeWinActive !== undefined && z !== undefined){
                horTimeSplit = H * Number(z) | 0;
                if (timeWin.active && timeWinActive === "false") {
                     timeWin.close();
                } else if (!timeWin.active && timeWinActive === "true") {
                     timeWin.open();

                }
            }
        }
    }
    const logWin = {
        top : 0,
        left : 0,
        right : 0,
        bottom : 0,
        setVals(){
            this.left = vertSplit;
            this.bottom = H - horSplit;
        },
        el : logContainer,
        size(){
            logWin.el.style.left = logWin.left + "px";
            logWin.el.style.right = logWin.right + "px";
            logWin.el.style.top = logWin.top + "px";
            logWin.el.style.bottom = logWin.bottom + "px";
        }
    }
    const editWin = {
        top : 0,
        left : 0,
        right : 0,
        bottom : 0,
        setVals(){
            this.right = W - vertSplit;
            if(timeWin.active) {
                 this.bottom = H-horTimeSplit;
            }else{
                this.bottom = 0;
            }
        },
        el : editContainer,
        size(){
            editWin.el.style.left = editWin.left + "px";
            editWin.el.style.right = editWin.right + "px";
            editWin.el.style.top = editWin.top + "px";
            editWin.el.style.bottom = editWin.bottom  + "px";
        }
    }
    const uiWin = {
        top : 0,
        left : 0,
        right : 0,
        bottom : 0,
        setVals(){
            this.left = vertSplit;
            this.top = horSplit;
        },
        el : uiContainer,
        bottomElement : null,
        size(){
           uiWin.el.style.left = uiWin.left + "px";
           uiWin.el.style.right = uiWin.right + "px";
           uiWin.el.style.top = uiWin.top + "px";
            if(uiWin.bottomElement){
                const bounds = uiWin.bottomElement.getBoundingClientRect();
                uiWin.bottomElement.style.height = ((H -  bounds.top - 4) | 0) + "px";
            }
        }
    }
    const timeWin = {
        active : horTimeSplit > -1,
        top : 0,
        left : 0,
        right : 0,
        bottom : 0,
        oldSplitPos : H - setup.minTimeHeight,
        setVals(){
            if(this.active){
                this.right = W - vertSplit;
                this.top = horTimeSplit;
                
            }else{
            }
        },
        close() {
            if(timeWin.active){
                timeWin.oldSplitPos = horTimeSplit;
                horTimeSplit = -1;
                timeWin.active = false;
                timeWin.el.classList.add("hideTimeline");
            }
        },
        open() {
            if(!timeWin.active){
                horTimeSplit = timeWin.oldSplitPos;
                timeWin.active = true;
                timeWin.el.classList.remove("hideTimeline");
            }
        },
        el : timeContainer,
        bottomElement : null,
        size(){
            if(this.active){
                timeWin.el.style.right = timeWin.right + "px";
                timeWin.el.style.top = timeWin.top + "px";
            }
        }
    }
    function hideUI(settings = {}) {

        timeWinState = timeWin.active;
        if (settings.hideUIFull) {
            hidingFullUI = true;
            sizeBar.classList.add("hide");
            if (timeWin.active) { timeWin.close() }
        } else {
            sizeBar.classList.add("hoverOnly");
            sizeBarTime.classList.add("hoverOnly");
            !hidingUITime && (timeWinPos = horTimeSplit);
        }
        if  (settings.hideUIInfo) {
            noUIInfoContainer.textContent = settings.hideUIInfo;
            noUIInfoContainer.classList.add("show");
            setTimeout(() => noUIInfoContainer.classList.remove("show"), settings.hideUIInfoTime ? settings.hideUIInfoTime : 4000);
        }
        hidingUI = true;
        hidingUITime = true;
        saveState();

    }
    function outCanvas() {
        clearTimeout(timeoutHdl);
        mouse.cMouse.addEvent("overcanvas", overCanvas);
        mouse.cMouse.removeEvent("outcanvas", outCanvas);
    }
    function overCanvas() {
        timeoutHdl = setTimeout(()=>{
                mouse.cMouse.removeEvent("outcanvas", outCanvas);
                issueCommand(commands.sysHideUIToggle);
            }, UIHideTime
        );
        mouse.cMouse.removeEvent("overcanvas", overCanvas);
        mouse.cMouse.addEvent("outcanvas", outCanvas);

    }
    function showUI(settings = {}) {
        if (hidingUI || hidingUITime) {
            if (settings.hideOnCanvas) {
                if(settings.showTimeBar) {
                    hidingUITime = false
                    horTimeSplit = timeWinPos;
                    sizeBarTime.classList.remove("hoverOnly");

                } else {
                    hidingUI = false;
                    sizeBar.classList.remove("hoverOnly");

                }
                mouse.cMouse.addEvent("overcanvas", overCanvas);
            } else {
                hidingFullUI = hidingUI = hidingUITime = false;
                sizeBar.classList.remove("hoverOnly");
                sizeBarTime.classList.remove("hoverOnly");
                sizeBar.classList.remove("hide");
                sizeBarTime.classList.remove("hide");
                noUIInfoContainer.classList.remove("show");
                if (timeWinState) {
                    horTimeSplit = timeWinPos;
                    timeWin.open()
                }
            }
            saveState();

        }
    }

    function update(){
        if (firstUpdate) {
            firstUpdate = false;
            getSavedState();
        }

        if (hidingFullUI) {


        } else if (hidingUI || hidingUITime) {
            if(hidingUI) {
                vertSplit = W;
            } else {
                vertSplit = vertSplit >= W - setup.minRightSize ? W - setup.minRightSize : vertSplit < 100 ? 100 : vertSplit;
                horSplit = horSplit >= H - 10 ? H - 10 : horSplit < setup.minRightHeight ? setup.minRightHeight : horSplit;
            }
            if(hidingUITime) {
                horTimeSplit = H-3;
            } else {
                if(timeWin.active){
                    horTimeSplit = horTimeSplit >= H - 10 ? H - 10 : horTimeSplit < H - setup.minTimeHeight ? H - setup.minTimeHeight : horTimeSplit;
                }
            }
        } else {
            if(timeWin.active){
                horTimeSplit = horTimeSplit >= H - 10 ? H - 10 : horTimeSplit < H - setup.minTimeHeight ? H - setup.minTimeHeight : horTimeSplit;
            }
            vertSplit = vertSplit >= W - setup.minRightSize ? W - setup.minRightSize : vertSplit < 100 ? 100 : vertSplit;
            horSplit = horSplit >= H - 10 ? H - 10 : horSplit < setup.minRightHeight ? setup.minRightHeight : horSplit;
            
        }
        timeWin.setVals();
        logWin.setVals();
        editWin.setVals();
        uiWin.setVals();
        timeWin.size();
        logWin.size();
        editWin.size();
        uiWin.size();
        commandInput.style.width = (W - vertSplit - 0) + "px";
    }
    function mouseMove(mouse){
        var dx = mouse.page.x - lastMouse.x;
        var dy = mouse.page.y - lastMouse.y;
        if(currentBar.dataset.type === "vert"){
            vertSplit += dx;
        }else if(currentBar.dataset.type === "horTime"){
            horTimeSplit += dy;
        }else{
            horSplit += dy;
        }
        update();
        lastMouse.x = mouse.page.x;
        lastMouse.y = mouse.page.y;
    }
    function mouseDown(mouse,event){
        if((mouse.button & 1) === 1 && mouse.captured === 0) { mouse.requestCapture( id ) }
        if(mouse.captured === id){
            if((mouse.button & 1) === 1){
                dragging = true;
                mouse.onmove = mouseMove;
                lastMouse.x = mouse.page.x;
                lastMouse.y = mouse.page.y;
                currentBar = event.target;
            }else  if((mouse.button & 1) === 0){
                mouse.release(id);
                dragging = false;
                mouse.onmove = null;
                mouse.forElement(currentBar);
                if(mouse.over === false){ mouseOut({target : currentBar}) }
                saveState();
            }
        }
    }
    function mouseOut(event){
        if(mouse.captured === 0){
            mouse.onbutton = null;
            event.target.classList.remove("highlightSizer");
        }
    }
    function mouseOver(event){
        if(mouse.captured === 0){
            if ((hidingUI && !event.target._isTimeBar) || (hidingUITime && event.target._isTimeBar) && !hidingFullUI) {
                issueCommand(event.target._isTimeBar ? commands.sysShowTimeBarTemp : commands.sysShowUITemp);
            } else {
                mouse.onbutton = mouseDown;
                event.target.classList.add("highlightSizer");
            }
        }
    }
    sizeBar.addEventListener("mouseover", mouseOver);
    sizeBar.addEventListener("mouseout", mouseOut);
    sizeBarLog.addEventListener("mouseover", mouseOver);
    sizeBarLog.addEventListener("mouseout", mouseOut);
    sizeBarTime.addEventListener("mouseover", mouseOver);
    sizeBarTime.addEventListener("mouseout", mouseOut);
    sizeBarTime._isTimeBar = true;
    addEventListener("resize",()=>{
        W = innerWidth;
        H = innerHeight;
        vertSplit = (vertSplit / oldInnerWidth)  * W | 0;
        horSplit = (horSplit / oldInnerHeight)  * H | 0;
        horTimeSplit = (horTimeSplit /oldInnerHeight)  * H | 0;
        oldInnerWidth  = W;
        oldInnerHeight  = H;
        update();
    });
    update();
    return function(settings = {}){
        if(settings.isTimelineOpen){
            return timeWin.active;
        }
        if(settings.uiWinBottom !== undefined){
            uiWin.bottomElement = settings.uiWinBottom;
            delete settings.editWinBottom;
        }
        if(settings.onafterupdate){
            onafterupdate = settings.onafterupdate;
            delete settings.onafterupdate;
        }
        if(settings.fireAfterUpdate){
            if(onafterupdate) { onafterupdate({vertSplit,horSplit,horTimeSplit}) }
            delete settings.fireAfterUpdate;
        }
        if(settings.horTimeSplit) {
            horTimeSplit = H - settings.horTimeSplit;
            if (hidingUITime) { timeWinPos = horTimeSplit }
            delete settings.horTimeSplit;
        }
        if(settings.showUI) {
            showUI(settings);
            delete settings.showUI;
            delete settings.hideOnCanvas;
            delete settings.showTimeBar;
        }
        if (settings.hideUI) {
            hideUI(settings);
            delete settings.hideUIInfo;
            delete settings.hideUIInfoTime;
            delete settings.hideUIFull;
            delete settings.hideUI;
        }
        if(settings.toggleTimeline){
            if(timeWin.active){
                timeWin.close();
            }else {
                timeWin.open();
            }
            saveState();
            delete settings.toggleTimeline;

        }
        Object.assign(setup,settings);
        update();
    }
})();