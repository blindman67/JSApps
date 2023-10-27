"use strict";

const ScriptLoader = (() => {
    var pollRate = 500;
    var maxLoadTime = 10000 * 1000;
    var loading = false;
    const scripts = new Map();
    function Script(name, file, confirm, loadedOK, failed, ...dependencies) {
        this.name = name;
        this.file = file;
        this.confirm = confirm;
        this.loadedOK = loadedOK;
        this.failed = failed;
        this.dependencies = [...dependencies];
        this.loading = false;
        this.loaded = false;
        this.error = false;
    }
    Script.prototype = {
        canLoad() {
            for (const dep of this.dependencies) {
                const s = scripts.get(dep);
                if (s.loading || !s.loaded || s.error) {
                    return false;
                }
            }
            return !this.canRun();
        },
        canRun() { return this.loaded && !this.error },

        load() {
            if (this.canLoad()) {
                this.loading = true;
                this.startTime = performance.now();
                $$(document.body, $("script", {src:this.file}));
                loadingScripts.push(this);
                if (!loading) {
                    poller(true)
                }
            }
        }
    }
    const loadingScripts = [];
    function poller(start) {
        if (!start) {
            const remove = [];
            let more = false;
            for (const s of loadingScripts) {
                if (s.loading) {
                    if (s.confirm()) {
                        s.loaded = true;
                        s.loading = false;
                        more = true;
                        remove.push(s);
                    } else if (performance.now() - s.startTime > maxLoadTime) {
                        s.loaded = true;
                        s.loading = false;
                        s.error = true;
                        remove.push(s);
                        log.warn("Script load error: '" + s.name + "'");
                    }
                }
            }
            var i = loadingScripts.length;
            while (i-- > 0) {
                const s = loadingScripts[i];
                if (remove.includes(s)) {
                    loadingScripts.splice(i,1);
                    !s.error ? s.loadedOK(s) : s.failed("Load timeout");
                    log.sys("Script load confirmed: '" + s.name + "'");
                    s.loadedOK = s.failed = undefined;
                }
            }
            if (more) { startLoading() }
        }
        if (loadingScripts.length) {
            loading = true;
            setTimeout(poller, pollRate);
        } else {
            loading = false;
        }
    }
    var startHdl;
    function startLoading() {
        clearTimeout(startHdl);
        startHdl = setTimeout(() => API.load(), pollRate);
    }

    const API = {
        set pollingRate(v) { pollRate = v },
        addScript(name, fileName, confirm, ...dependencies) {
            if (scripts.has(name)) { return }
            startLoading();
            return new Promise((loadedOK, failed) => {
                var s = new Script(name, fileName, confirm, loadedOK, failed, ...dependencies);
                scripts.set(name, s);
            });


        },
        load() {
            for (const s of scripts.values()) {
                if ((!s.loading && !s.loaded) && s.canLoad()) { s.load(); }
            }
        },
        canRun(name) { return scripts.has(name) ? scripts.get(name).canRun() : false; }
    };
    return API;
})();