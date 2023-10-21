import {Events} from "./Events.jsm";
var appName;
var isLoaded = false;
const settings = {
    wavEditWindowWidth: 1024,
    dimOutOfKey: true,
    synthMode: "MODE2",        
};
const settingsDesc = {
    wavEditWindowWidth: "View width in pixels of wav edit window.",
    dimOutOfKey: "When on notes not part of current key are visualy deminished",
    synthMode: "MODE1 legacy mode Do Not Use!",
};
const settingsVet = {
    dimOutOfKey(val) { return val === true || val === "true" ||  val === "True" || val === "TRUE" },
    synthMode(val) { return val.toUpperCase() === "MODE2" ? "MODE2" : "MODE1"; },
};
function saveSettings() {
    localStorage[appName + "_settings"] = JSON.stringify(settings);
}
function loadSettings(name) {
    appName = name;
    if (localStorage[appName + "_settings"]) {
        try {
            const loaded = JSON.parse(localStorage[appName + "_settings"]);
            Object.assign(settings, loaded);
            isLoaded = true;
        } catch(e) { }
    }
    if (!isLoaded) {
        saveSettings();
        isLoaded = true;
    }
    
    
}
const Settings = (() => {
    const API = {
        init(name) {
            loadSettings(name);
            API.fireEvent("update");
        },
        update(settingName, settingVal) {
            if (settingName !== undefined) {
                settings[settingName] = settingsVet[settingName](settingVal);
                saveSettings();
            }
            API.fireEvent("update");
        },
        byName(name) { return settings[name]; },
        get description() { return settingsDesc; },
    };
    
    Object.assign(API, Events(API));
    return API;
})();
export {Settings};

    