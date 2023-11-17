const ColorScheme = {
    darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
    schemes: {dark: null, light: null},
    schemeLink: null,
    ignore: false, 
    setCSS(darkCSSName, lightCSSName) {
        this.schemes.dark = darkCSSName;
        this.schemes.light = lightCSSName;
    },
    setColorScheme() { this.schemeLink && (this.schemeLink.href = this.darkMode ? this.schemes.dark : this.schemes.light); },
    useDark() {
        this.stop();
        this.darkMode = true;
        this.setColorScheme();
    },
    useLight() {
        this.stop();
        this.darkMode = false;
        this.setColorScheme();
    },
    onSchemeChange(e) {
        if (!this.ignore) {
            this.darkMode = e.matches;
            this.setColorScheme();
        }
    },     
    listen() { 
        matchMedia("(prefers-color-scheme: dark)").addEventListener("change", this.onSchemeChange.bind(this));
        this.listen = () => this.ignore = false;
    },
    stop() { this.ignore = true; }
}
export {ColorScheme}