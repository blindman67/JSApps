const Storage = {
    async loadJson(url) { return (await fetch(url)).json(); }
    
    
}
export {Storage};