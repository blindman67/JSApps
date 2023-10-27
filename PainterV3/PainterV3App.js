"use strict";



addEventListener("load",() => {
    const $ = (tag, props = {}) => {
        var style;
        if(props.style) {
            style = props.style;
            delete props.style;
        }
        const element = Object.assign(document.createElement(tag),props);
        if(style) { Object.assign(element.style, style) }
        return element;
    }
    const $$ = (element, ...children) => {
        for(const sib of children) {
            element.appendChild(sib);
        }
        return element;
    }
    const log = data => $$(info, $("div", {textContent: "data"}));   
    
    info.textContent = "App code loaded parsed and run.";
    if ('serviceWorker' in navigator) {
        //navigator.serviceWorker.register('./service-worker.js').then(() => info.textContent = ('Service Worker Registered') );
        navigator.serviceWorker.register('service-worker.js', {
            scope: './'
        }).then(reg => {
            var sWorker;
            if (reg.installing) {
                sWorker = registration.installing;
                log("Installing PainterV3");
            } else if (registration.waiting) {
                sWorker = registration.waiting;
                log("Service worker waiting");

            } else if (registration.active) {
                sWorker = registration.active;
                log("Service worker active");


            }
            if (sWorker) {
                // logState(serviceWorker.state);
                log("Add state change  " + sWorker.state);
                sWorker.addEventListener('statechange', function (e) {
                    log("State change " + e.target.state);
                    // logState(e.target.state);
                });
            }
        }).catch (function (error) {
            // Something went wrong during registration. The service-worker.js file
            // might be unavailable or contain a syntax error.
        });
    }    
});
