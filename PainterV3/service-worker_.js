var dataCacheName = "Painter-v3";
var cacheName = "Painter-test-1";
var resources = [
    "/",
    "./icons/siteIcon.png",
    "./PainterV3App.js",
    "./PainterV3App.css",
    "./PainterV3App.html",
    "./PainterV3.css",
    "./firstLoadScript.js",
    "./customCursors.js",
    "../GitHub/geeQuery/geeQuery.js",
    "../GitHub/LZipper/LZipperLite.js",
    "../GitHub/practicalSVG/createSVG.js",
    "../GitHub/SVGFilters/SVGFilters.js",
    "../GitHub/CanvasShapes/canvasShapesExtension.js",
    "../GitHub/EZWebWorkers/EZWebWorkers.js",
    "./quant256.js",
    "./commands.js",
    "./filters.js",
    "./utils.js",
    "./fileReadWriter.js",
    "./buttons.js",
    "../GitHub/EZView/EZView.js",
    "./Events.js",
    "./loans.js",
    "./curves.js",
    "./nameBrushPresets.js",
    "./localProcessImage.js",
    "./media.js",
    "./sprite.js",
    "./sprites.js",
    "./selection.js",
    "./animation.js",
    "./spriteRender.js",
    "./drop.js",
    "./colours.js",
    "./mediaList.js",
    "./spriteList.js",
    "./extrasList.js",
    "./webGLFilters.js",
    "./editSprites.js",
    "./paint.js",
    "./extraRenders.js",
    "./snaps.js",
    "./guides.js",
    "./mouseBrush.js",
    "./cuttingTools.js",
    "./specialBrushes.js",
    "./curved.js",
    "./pens.js",
    "./widget.js",
    "./grid.js",
    "./timeline.js",
    "./mouseKeyboard.js",
    "./displaySizer.js",
    "./heartBeat.js",
    "./logger.js",
    "./render.js",
    "./commandManager.js",
    "./menu.js",
    "./commandLine.js",
    "./storage.js",
    "./PainterV3.js",
    "../GitHub/GIFGroover/GIFGroover.js",
    "../GitHub/FilterGL/FilterGL.js",
    "./workers/worker_Lzipper.js",
    "./workers/worker_Dithering.js",
    "./workers/worker_HighLowFilters.js",
    "./workers/worker_ImageMorpher.js",
    "./gifEncoder.js",
    "./icons/heartBeat.png",
    "./icons/icons.png",
    "./icons/mouse_rotate_skew_ns.png",
    "./icons/mouse_rotate_skew_ew.png",
];
function install(e) {
    console.log("[ServiceWorker] Install");
    e.waitUntil(
        caches.open(cacheName).then(function (cache) {
            console.log("[ServiceWorker] Caching app shell");
            return cache.addAll(resources);
        }));
}    
function activate(e) {
    console.log("[ServiceWorker] Activate");
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                    if (key !== cacheName && key !== dataCacheName) {
                        console.log("[ServiceWorker] Removing old cache", key);
                        return caches.delete(key);
                    }
                }));
        }));
    return self.clients.claim();
}
function fetch(e) {
    var request;
    if(e instanceof Request) { request = e }
    else if(e) { request = e.request }
    else {console.log("[Service Worker] Fetch got an undefined event"); return }
    console.log("[Service Worker] Fetch", request.url);
    var dataUrl = "abcdefght";
    if (request.url.indexOf(dataUrl) > -1) {
        e.respondWith(
            caches.open(dataCacheName).then(function (cache) {
                return fetch(e.request).then(function (response) {
                    cache.put(e.request.url, response.clone());
                    return response;
                }).catch(e => {  console.log("[Service Worker Error] " + e.message) });                
            }).catch(e => {  console.log("[Service Worker Error] " + e.message) })
        );
    } else {
        e.respondWith(caches.match(e.request).then(response => response || fetch(e.request)));
    }
}
self.addEventListener("install", install);
self.addEventListener("activate", activate);
self.addEventListener("fetch", fetch);