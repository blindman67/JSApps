import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {NOTE_NAME, NOTE_FREQ, NOTE_IDX, createKey, NamedScales, chords, chordsNamed, guitar, noteNames} from "./music.jsm";


import {UI} from "./UI.jsm";
var UID = 1; // Unique Id to session, must not be duplicated, must not be reused
const APPNAME = "MusicGrooverV1";
localStorage[APPNAME + "_GUID"] = localStorage[APPNAME + "_GUID"] ? localStorage[APPNAME + "_GUID"] : 1;
function getGUID(){  // Global unique to Painter  must not be duplicated, must not be reused
    var GUID = Number(localStorage[APPNAME + "_GUID"] ) + 1;
    localStorage[APPNAME + "_GUID"]  = GUID;
    return GUID;
}
const APP_SESSION_ID = getGUID();
//function getUID(){ return UID++ }



const commons = {
    music: {
        NOTE_NAME, NOTE_FREQ, NOTE_IDX, createKey, NamedScales, chords, chordsNamed, guitar, noteNames,
    },
    getUID: getGUID,
    APPNAME,
}

startAudioBtn.addEventListener("click", () => {
    content.classList.remove("hide");
    UI.start(commons);
    startAudioBtn.textContent = "OK:";
    requestUserClick.classList.add("hide");
});

export {APPNAME}