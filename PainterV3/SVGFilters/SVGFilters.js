"use strict";

//debugger
//if (window.createSVG) {
    const SVGFilters = (()=>{
        var svgID = "SVGFilters";
        var filterID = 0;
        var filterIDPrefix = "SVGFilters_Filter";
        var domContainer;
        const area = {
            x : 0,
            y : 0,
            width : 100,
            height : 100,
            overflow : 10,
            offset : 2,
        }
        var svg, defs;
        var filterNameRef = ["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]  
        
        const filters = {
            blur(filter, settings = {amount : 8, edge : "none"}){
                // edge modes [duplicate wrap none]
                filter.blur = createSVG("feGaussianBlur", {stdDeviation : settings.amount, edgeMode : settings.edge});
            },
            erode(filter, settings = {amount : 1}){
                filter.erode = createSVG("feMorphology", {radius : settings.amount, operator : "erode"});
            },
            dilate(filter, settings = {amount : 1}){
                filter.dilate = createSVG("feMorphology", {radius : settings.amount, operator : "dilate"});
            },
            turbulence(filter, settings = {amount : 1}){
                filter.trub     = createSVG("feTurbulence", {baseFrequency : settings.amount / 100, numOctaves : 2, result : "turb"});
                filter.displace = createSVG("feDisplacementMap", {scale : settings.amount * 10, in2 : "turb", in : "SourceGraphic", xChannelSelector : "R", yChannelSelector : "G", result : "dis"});
                filter.offset   = createSVG("feOffset", {in : "dis", dx : -settings.amount * 2.5, dy : -settings.amount * 2.5});
            },
            displace(filter, settings = {amount : 1}){
                filter.displace = createSVG("feDisplacementMap", {scale : settings.amount * 10, in2 : "SourceGraphic", in : "SourceGraphic", xChannelSelector : "R", yChannelSelector : "G", result : "dis"});
                filter.offset   = createSVG("feOffset", {in : "dis", dx : -settings.amount * 2.5, dy : -settings.amount * 2.5});
            },
            outline(filter,settings = {amount : 1}){
                filter.dilate = createSVG("feMorphology", {radius : settings.amount, operator : "dilate",in : "SourceGraphic", result : "thickened"});
                filter.out = createSVG("feComposite", {operator : "out", in : "SourceGraphic", in2 : "thickened"});
            },
       
        }
        
        const API = {
            start(container = document.body, name = svgID){
                if(typeof container === "string"){
                    const contName = container;
                    container = document.querySelector(container);
                    if(container === null){
                        throw new ReferenceError("Invalid DOM reference could not find '"+contName+"'");
                    }
                }
                domContainer = container;
                svg = createSVG("svg",{id : svgID});
                defs = svg.defs = createSVG("defs");
                container.appendChild(svg.node);
                return svg.node;
            },
            removeAll(){
                if(domContainer){
                    domContainer.removeChild(svg.node);
                    defs = undefined;
                    domContainer = undefined;
                    svg.node = undefined;
                    svg = undefined;
                }
            },
            setImageArea(x,y,width,height,overflow){
                area.x = x;
                area.y = y;
                area.width = width;
                area.height = height;
                area.overflow = overflow;
            },
            getFilterNode(urlRef){
                const name = urlRef.replace(/url\(#|\)/gi,"");
                return defs[name];
            },
            addFilter(type, settings){
                var name;
                if(svg === undefined){
                    throw new ReferenceError("Could not create filter. SVGFilters has not been started.");
                    
                }
                if(filters[type]){
                    name = filterIDPrefix + filterID ++;
                    const filter = defs[name] = createSVG("filter",{id : name, filterUnits : "objectBoundingBox", x : area.x - area.offset, y : area.y - area.offset, width : area.width + area.offset * 2, height : area.height + area.offset * 2});
                    filters[type](filter,settings);
                
                    return "url(#"+name+")";
                }
                throw new ReferenceError("Could not create filte. Unknown filter type " + type + "'");
            },
            
            
            
        };
        return API;
        
    })();
    window.SVGFilters = SVGFilters;
    
    
//} else {
//   throw new ReferenceError("Could not install SVGFilters, requiers praticalSVG.");
//}

