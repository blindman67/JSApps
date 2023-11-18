const FZ = Object.freeze;
const content = (textContent, className) => FZ({textContent, className});
const sizeImage = (src, title, width, height) => FZ({src,  ...(title ? {title} : {}), ...(width ? {width} : {}), ...(height ? {width} : {})});
const descriptions = {
    painter: `Click to try.
PainterV3 is a large and complex application written in JavaScript (~112,000 lines of code)
GitHub hosted static pages do not use IIS (MS's Internet Information Service) and 
as such there is a lot of work needed to make PainterV3 compatible with static pages
Some feature have been disable, and due to the complexity 
I may have overlooked some features which may behave unexpectedly.`,
    aoids: `Click to play
This Demo version has base building resource cheats on.
Base building cost very little and a full base can be build from the start.
`,
    sticks: `Click to try.
Many features have been disabled.
You can download created models, but you may not load them.
The [Example Scenes] menu has some example scenes to try.
Some features may not work.`,
};

const css = {  // CSS class names
    bigHead: "ignore bigHead",
    head: "ignore head",
    help: "ignore help",
    helpIndent: "ignore help indent",
    link: "link",
    links: "links",
    padLink: "link padLink",
    info: "ignore",
    linePad: "ignore",
    imageWrap: "ignore help",
    extern: "externLink",
    header: "pageHeader",
    image: "",
    imageOverlay: "imageOverlay",
    
};
const extras = {
    pool: {desc: "Click to play", className: css.padLink},
    imageSize: 220, 
    overlayAnimTime: 150, // in milliseconds 1/1000th
};

const Page = FZ({
    title: "Blindman67 Demos",
    icon: "./media/BlindmanLogo.png",
    schemes: FZ({
        dark: "darkScheme.css",
        light: "lightScheme.css",
    }),
    css: FZ(["canvasTemplate.css"]),
    rules: FZ({...css}),
    renderPage: "canvasTemplate.js",
    external: FZ([
        {name: "CodePen", title: "Open in new TAB\nBlindman67 at CodePen", link: "https://codepen.io/Blindman67", className: css.extern},
        {name: "Shadertoy", title: "Open in new TAB\nBlindman67 at Shadertoy", link: "https://www.shadertoy.com/user/Blindman67", className: css.extern},
        {name: "Github", title: "Open in new TAB\nBlindman67 at Github", link: "https://github.com/blindman67", className: css.extern},
        {name: "StackOverflow", title: "Open in new TAB\nBlindman67 at StackOverflow", link: "https://stackexchange.com/users/4801111", image: sizeImage("https://stackexchange.com/users/flair/4801111.png", undefined, 208, 58), className: css.extern },
    ]),
    extras: FZ(extras),
    content: FZ({        
        heading: FZ({
            title: content("JavaScript experiments by Blindman67", css.bigHead),
            desc: [
                content("All apps are intended to be used on a desktop PC with either a 3 button mouse and wheel, or a standard keyboard.", css.helpIndent),
                content("No 3rd party JavaScript frameworks used in any of the examples below.", css.helpIndent),
            ],
            
            copyright: content("All content Copyright Blindman67 2016-2023", css.help),
        }),
        apps: FZ([
            FZ({  // Painter
                name: content("Painter V3. For all thing game creation", css.head),
                link: FZ({ref: "./PainterV3/PainterV3.html", name: "[Painter V3] Almost ready", desc: descriptions.painter}),
                images: [sizeImage("./media/PainterScreenShot.png", "Screen capture showing Key-frame/Animation panel\nColour panel\nSprites edit panel\nConsole panel\nSprite list Tab", extras.imageSize)]
            }),
            FZ({  // Aoids
                name: content("Aoids-2 Space base building with 2D arcade action.", css.head),
                info: FZ([
                    content("Writen in JavaScript and using WebGL2 API.", css.help),
                    content("For the best experiance hit F11 (Chrome Win11) when loaded, for fullscreen mode.", css.info),
                    content("To return to window mode hit F11 again.", css.info),                    
                ]),
                link: FZ({ref: "./Apps/Aoids", name: "Aoids-2. Concept test.", desc: descriptions.aoids}),
                images: [
                    sizeImage("./media/AoidsScreenShotA.png", "Base building, Manage power, personel, mining, radar, defence weaponry and more.", extras.imageSize),
                    sizeImage("./media/AoidsScreenShotB.png", "Defending base from rocks, and collecting resources", extras.imageSize),
                    sizeImage("./media/AoidsScreenShotC.png", "Accurate 2D N-Body simulation. All rocks and ships have gravity applied.", extras.imageSize),
                ]
            }),          
            FZ({  // Sticks
                name: content("Physic simulation using verlet intergration", css.head),
                link: FZ({ref: "./Sticks/", name: "[Sticks editor] Demo version only", desc: descriptions.sticks, asURL: true}),
                images: [
                    sizeImage("./media/SticksScreenShotA.png", "Suspension bridge with traffic in real-time.", extras.imageSize),
                    sizeImage("./media/SticksScreenShotB.png", "101 story collapse in real-time.", extras.imageSize),
                    sizeImage("./media/SticksScreenShotD.png", "Car over jump and nails the landing.", extras.imageSize),
                ]
            }), 
            FZ({  // Pool
                name: content("Pool table simulation using 2D HTMLCanvasElement and CanvasRenderingContext2D API", css.head),
                info: FZ([
                    content("Note this game has sound FX that will start with your first shot.", css.info),
                    content("Best played in full sccreen.", css.info),
                    content("In Game hit F11 to toggle full screen, and F5 to reload game.", css.info),
                ]),
                links: FZ([
                    FZ([
                        {ref: "./Apps/Pool/index.html?small",                   name: "Small 7ft table",       ...extras.pool},
                        {ref: "./Apps/Pool/index.html?small_guides",            name: "With guides",           ...extras.pool},
                        {ref: "./Apps/Pool/index.html?small_guides_complex",    name: "With full shot guides", ...extras.pool},
                    ]), FZ([
                        {ref: "./Apps/Pool/index.html?medium",                  name: "Medium 8ft table",      ...extras.pool},
                        {ref: "./Apps/Pool/index.html?medium_guides",           name: "With guides",           ...extras.pool},
                        {ref: "./Apps/Pool/index.html?medium_guides_complex",   name: "With full shot guides", ...extras.pool},
                    ]), FZ([
                        {ref: "./Apps/Pool/index.html?standard",                name: "Standard 8.5ft table",  ...extras.pool},
                        {ref: "./Apps/Pool/index.html?standard_guides",         name: "With guides",           ...extras.pool},
                        {ref: "./Apps/Pool/index.html?standard_guides_complex", name: "With full shot guides", ...extras.pool},
                    ]), FZ([
                        {ref: "./Apps/Pool/index.html?large",                   name: "Large 9ft table",       ...extras.pool},
                        {ref: "./Apps/Pool/index.html?large_guides",            name: "With guides",           ...extras.pool},
                        {ref: "./Apps/Pool/index.html?large_guides_complex",    name: "With full shot guides", ...extras.pool},
                    ]), FZ([
                        {ref: "./Apps/Pool/index.html?huge",                    name: "Huge 11ft table",       ...extras.pool},
                        {ref: "./Apps/Pool/index.html?huge_guides",             name: "With guides",           ...extras.pool},
                        {ref: "./Apps/Pool/index.html?huge_guides_complex",     name: "With full shot guides", ...extras.pool},
                    ]),
                ]),
                images: [
                    sizeImage("./media/PoolScreenShotA.png", "Very accurate collision simulation. Adaptable time slices\n(well over millionth of a second) allows realistic breaks.", extras.imageSize),
                    sizeImage("./media/PoolScreenShotB.png", "Play guides to help you become expert", extras.imageSize),
                ]
            }),              
            FZ({   // More games
                name: content("More games", css.head),
                info: FZ([content("More example games written in JavaScript", css.help)]),
            }),              
            FZ({  // PowerSlider
                info: FZ([content("Mouse selects game size. Direction keys to slide tiles. Aim is to get tile with 1024", css.help),]),
                link: FZ({ref: "./standalone/PowerSlider/index.html", name: "Powers of Two. Modified 1024 game", desc: "Click to play"}),
            }),            
            FZ({  // Space invaders
                info: FZ([content("Keyboard [1] insert coin. [S] Play [Left][Right] to move [Up] to fire.", css.help),]),
                link: FZ({ref: "./standalone/SpaceInvaders/index.html", name: "Space Invaders.", desc: "Click to play"}),
            }),            
            FZ({ // PacMan
                info: FZ([content("Keyboard only. Any key to start. Arrow keys to move.", css.help),]),
                link: FZ({ref: "./standalone/GhostsRevenge/index.html", name: "Ghosts Revenge. Pac-Man clone.", desc: "Click to play"}),
            }),                 
        ]),
        
    })
});
export {Page};


