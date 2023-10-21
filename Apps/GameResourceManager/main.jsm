import {$, $$, $R} from "../../src/DOM/geeQry.jsm";
import {Storage} from "../../src/utils/Storage.jsm";



//file:///D:\Marks\JavaScript\canvasTemplate\Apps\GameResourceManager\index.html

var gameData, schema;

Storage.loadJson("allAssets.json")
    .then(data => gameData = data)
    .then(start); 
const floatImage = $("div",{className: "floating image"});    
$$(document.body, floatImage); 

    
const getDataType = value => typeof value;   
const classNames = (...args)  => ({className: args.join(" ")});   
const readablePath = path  => path.join(".");   
function showData(obj, path, dataContainer, depth = 0) {
    if (depth < 20) {
        const isArr = $.isArr(obj);
        const headerType = "h" + Math.min(3, depth + 1);
        for (const [key, value] of Object.entries(obj)) {
            let k = key + "";
            if (isArr) { k = "[" + (k.padStart(4," ")) + "]"; }            
            if ($.isObj(value)) {
                const container = $("div", {...classNames("data", "level" + (depth + 1))});
                $$(dataContainer, 
                    $(headerType, {
                        textContent: "- " + k, 
                        ...classNames("overline", "folding"),
                        _canFold: true,
                        _folded: false,
                        _folds: container,
                    }),
                    container
                );
                showData(value, [...path, key], container, depth + 1);
            } else if ($.isArr(value)) {
                const container = $("div", {...classNames("data", "level" + (depth + 1))});
                $$(dataContainer, 
                    $(headerType, {
                        textContent: "- " + k + "[" + ((value.length + "").padStart(4, " ")) + "]", 
                        ...classNames("overline", "folding"),
                        _canFold: true,
                        _folded: false,
                        _folds: container,
                    }),
                    container
                );
                showData(value, [...path, key], container, depth + 1);                
        
            } else {
                const type = getDataType(value);
                let val = value;
                if (type === "string") { val = "\"" + value + "\""; }
                if (val.includes(".png")) {
                    k = k.padEnd(23, ".") + ":";
                    const title = readablePath([...path, key]);
                    var img;
                    $$(dataContainer, 
                        $$($("dl", {...classNames("data", "item"), title}), 
                            $("dt", {textContent: k, ...classNames("data", type, "name")}),
                            img = $("dd", {textContent: val, ...classNames("data", type, "value")}),
                        )
                    );            
                    img.addEventListener("click", () => { 
                        floatImage.innerHTML = "";
                        $$(floatImage, $("img", {src: "file:///"+value}));
                    });
                } else {
                    k = k.padEnd(23, ".") + ":";
                    const title = readablePath([...path, key]);
                    $$(dataContainer, 
                        $$($("dl", {...classNames("data", "item"), title}), 
                            $("dt", {textContent: k, ...classNames("data", type, "name")}),
                            $("dd", {textContent: val, ...classNames("data", type, "value")}),
                        )
                    );
                }
            }
        }
    }
}   

const checkFileExists = ["echo off\necho Aoids file check\n"];

function AddTestFile(filename) {
    checkFileExists.push(
`if not exist ${filename} (
    echo Missing file ${filename}
 )
 `);
}
 
function ExpandGroup(path, name, details) {
    const fullPath = path + details.dir;
    const files = [];
    if (details.names) {
        for (const n of details.names) {
            if (typeof n === "string") {
                for (const t of details.types) {
                    const fileName = fullPath.replace(/\[name\]/g, n) + t;
                    files.push(fileName);
                    AddTestFile(fileName);
                }
            }
        }
    }
    if (details.files) {
        for (const n of details.files) {
            if (typeof n === "string") {
                const fileName = fullPath.replace(/\[name\]/g, n)
                files.push(fileName);
                AddTestFile(fileName);
            }
        }
    }
    return files;
    
}
function Expand(data) {
    const all = {};
    var path;
    for (const [key, value] of Object.entries(data)) {
        if (key === "Info") {
            path = value.path;
            all.Info = value.desc;
        } else {
            all[key] = ExpandGroup(path, key, value);
        }
            
    }
    return all;


}    
function start() {
    const dataContainer = $("div", {...classNames("json")});

    
    showData(Expand(gameData), ["root"], dataContainer);
    $$(document.body, dataContainer);
    console.log(checkFileExists.join("\n"));
    addEventListener("click", (e) => {
        if (e.target._canFold) {
            if (e.target._folded) {
                e.target._folds.classList.remove("folded");
                e.target._folded = false;
                e.target.textContent = "-" + e.target.textContent.slice(1);
            } else {
                e.target._folds.classList.add("folded");
                e.target._folded = true;
                e.target.textContent = "+" + e.target.textContent.slice(1);
            }
        }
    });

}    



