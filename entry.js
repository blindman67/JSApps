import {$,$$} from "./src/DOM/geeQry.js";
import {ColorScheme} from "./src/DOM/ColorScheme.js";
import {simpleKeyboard} from "./src/DOM/keyboard.js";

const padder = className => (count) => $.setOf(count, () => $("li",{className}));    
const addProperty = (name, value) => (value === undefined || value === null || value?.trim?.() === "") ? {} : {[name]: value};
setTimeout(async () => {
    const Page = (await import(entryScript.dataset.page)).Page;
    if (Page) {
        ColorScheme.setCSS(Page.schemes.dark, Page.schemes.light);        
        $$($("?head", 0),
            $("title", {textContent: Page.title}),
            $("meta", {name: "description", content: Page.description.join("\n")}),
            ...Page.css.map(href => $("link", {rel: "stylesheet", type: "text/css", href})),
            ColorScheme.schemeLink = $("link", {rel: "stylesheet", type: "text/css", id: "schemeCSSLink", href: (ColorScheme.darkMode ? ColorScheme.schemes.dark : ColorScheme.schemes.light)}),
        );
        ColorScheme.listen();


        const pad = padder(Page.rules.linePad);
        document.body._extras = Page.extras;
        $$(document.body, 
            $$($("div", {id: "root", style: {display: "none"}}),
                $$($("div", {className: Page.rules.header}),
                    $("H2", Page.content.heading.title),
                    ...Page.external.map((extern, idx) => {
                        if (extern.image) {
                            return $$($("a", {
                                        href: extern.link, 
                                        target: "_blank", 
                                        //...addProperty("title", extern.title), 
                                        ...addProperty("className", extern.className),
                                        style: { left: "4px", top: "3px" }
                                    }),
                                    $("img", {
                                        src: extern.image.src + (ColorScheme.darkMode ? "?theme=dark" : ""),
                                        ...addProperty("title", extern.title), 
                                        ...addProperty("width", extern.image.width),
                                        ...addProperty("height", extern.image.height),
                                    })
                            );
                            
                        }
                        return $("a", {
                                href: extern.link, 
                                textContent: extern.name, 
                                target: "_blank", 
                                ...addProperty("title", extern.title), 
                                ...addProperty("className", extern.className),
                                style: { right: (idx * 100 + 20) + "px" }
                            }
                        )
                    })
                ),
                $$($("ul", {}),
                    ...pad(4),
                    //$("li", Page.content.heading.title),
                    $("li", Page.content.heading.copyright),
                    ...Page.content.heading.desc.map(desc => $("li", desc)),
                    //...pad(2),
                    ...(Page.content.apps.map(app => {
                        var dat, res = [];
                        app.name && res.push($("li", app.name));
                        if (app.link) {
                            res.push(dat = $("li", {className: Page.rules.link, title: app.link.desc, textContent: app.link.name}));
                            dat.dataset[app.link.asURL ? "url" : "named"] = app.link.ref;
                        } else if (app.links) {
                            res.push(...app.links.map(links => 
                                $$($("li", {className: Page.rules.links}),
                                    ...links.map(link => {
                                        dat = $("span", {className: link.className, title: link.desc, textContent: link.name});
                                        dat.dataset.url = link.ref;
                                        return dat;                                        
                                    })
                                )                                
                            ));
                        }
                        app.info && res.push(...app.info.map(info => $("li", info)));
                        dat = 0;
                        app.images && res.push(
                            $$($("li", {className: Page.rules.imageWrap}),
                                ...app.images.map(img => $("img", {
                                        src: img.src, 
                                        width: Page.extras.imageSize, 
                                        ...addProperty("className", Page.rules.image), 
                                        ...addProperty("title", img.title),
                                        ...addProperty("width", img.width),
                                        ...addProperty("height", img.height),                                        
                                        _imgSet: app.images,
                                        _imgIdx: dat++,
                                    })
                                )
                             )
                        );
                        res.push(...pad(2));
                        return res;
                    }).flat())
                )
            ),
            $("script", {type: "module", src: Page.renderPage})
        );
        $$(document.body, $$($("div", {id: "imageOverlayEl", className: Page.rules.imageOverlay, style: {display: "none"}})));
        const keyboard = simpleKeyboard();
        keyboard.addKey("KeyD", "KeyL");
        keyboard.onKey = (keyCode) => {
            if (keyCode === "KeyD") {
                ColorScheme.useDark();
            } else if (keyCode === "KeyL") {
                ColorScheme.useLight();
            }
        };        
    }
}, 0);


