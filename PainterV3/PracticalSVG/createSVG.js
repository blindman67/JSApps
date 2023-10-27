"use strict";
const createSVG = (()=>{
    /* This code uses some abreviations
       str is string
       arr is array
       num is number
       prop is property
       props is properties
       2 for conversion eg str2Num is string to number
    */
    var   id = 0;
    var   units = "";
    const svgNamespace = "http://www.w3.org/2000/svg";
    const transformTypes = {read : "read", write : "write"};
    
    const transformPropsName = "accent-height,alignment-baseline,arabic-form,baseline-shift,cap-height,clip-path,clip-rule,color-interpolation,color-interpolation-filters,color-profile,color-rendering,dominant-baseline,enable-background,fill-opacity,fill-rule,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,horiz-adv-x,horiz-origin-x,image-rendering,letter-spacing,lighting-color,marker-end,marker-mid,marker-start,overline-position,overline-thickness,panose-1,paint-order,pointer-events,rendering-intent,shape-rendering,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,text-anchor,text-decoration,text-rendering,underline-position,underline-thickness,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,vert-adv-y,vert-origin-x,vert-origin-y,word-spacing,writing-mode,x-height";
    
    const unitPropsNames ="width,height,x,y,z,x1,x2,y1,y2,cx,cy,rx,ry,r,accentHeight,alignmentBaseline,baselineShift,capHeight,fontSize,fontSizeAdjust,overlinePosition,overlineThickness,strikethroughPosition,strikethroughThickness,strokeWidth,underlinePosition,underlineThickness,vertOriginX,vertOriginY,wordSpacing,xHeight";
   
    /* Transform helper functions */
    const onlyArr2Str = (value, points = false) => {
        if (points) {
            if (Array.isArray(value)) {
                return value.map(point => Array.isArray(point) ? point.join(",") : point).join(" ");
            }
            return value;
        }
        return Array.isArray(value) ? value.join(" ") : value
    }
    
    /* Value transform functions */
    const str2Num      = Number;
    const arr2Str      = value => onlyArr2Str(value);
    const str2NumArr   = value => value.split(" ").map(str2Num);
    const unitStr2Num  = value => str2Num(value.replace(/[a-z]/gi, ""));
    const num2UnitStr  = value => value + units;
    const num2Percent  = value => value + "%";
    const pointArr2Str = value => onlyArr2Str(value, true);
    const url2Str      = value => value.replace(/url\(#|\)/g, "");
    const ref2Url      = value => {
        if (typeof value === "string") {
            if (value.indexOf("url(#") > -1) { return value }
            return `url(#${value})`;
        }
        if (value.isPSVG) {
            if (value.node.id) { return `url(#${value.node.id})` }
            value.node.id = "practicalSVG_ID_" + id++;
            return `url(#${value.node.id})`;
        }
        return value;
    };
    const str2PointArr = value => value.split(" ").map(point => {
        point = point.split(",");
        point[0] = str2Num(point[0]);
        point[1] = str2Num(point[1]);
        return point;
    });
    
    /* property value transforms `read` from SVG `write` to SVG */
    const transforms = {
        read : {
            offset      : unitStr2Num,
            points      : str2PointArr,
            filter      : url2Str,
            clipPath    : url2Str,
            stdDeviation: str2Num,
            dy          : str2Num,
            dx          : str2Num,
            tableValues : str2NumArr,
            values      : str2NumArr,
            kernelMatrix: str2NumArr,
            viewbox     : str2NumArr,
        },
        write : {
            //stdDeviation: str2Num,
            //dx          : str2Num,
            //dy          : str2Num,
            points      : pointArr2Str,
            offset      : num2Percent,
            filter      : ref2Url,
            clipPath    : ref2Url,
            tableValues : arr2Str,
            values      : arr2Str,
            kernelMatrix: arr2Str,
            viewbox     : arr2Str,
        },
    }
    
    /* Assign additional unit value transforms */
    unitPropsNames.split(",").forEach((propName) => {
        transforms.read[propName] = unitStr2Num;
        transforms.write[propName] = num2UnitStr;
    });
    
    /* Create property name transform lookups */
    const propNodeNames = transformPropsName.split(",");
    const propScriptNames = transformPropsName.replace(/-./g, str => str[1].toUpperCase()).split(",");

    /* returns transformed `value` of accosicated property `name`  depending on `[type]` defaults write*/
    const transform = (name, value, type = transformTypes.write) => {
        return transforms[type][name] ? transforms[type][name](value) : value;
    }
    
    /* returns Transformed JavaScript property name as SVG property name if needed. EG "fillRule" >> "fill-rule" */
    const propNameTransform = (name) => {
        const index = propScriptNames.indexOf(name);
        return index === -1 ? name : propNodeNames[index];
    }
    
    /* node creation function returned as the interface instanciator of the node proxy */
    const createSVG = (nodeType, props = {}) => {
        const PSVG = (()=>{  // PSVG is abreviation for Practical SVG 
            const node = document.createElementNS(svgNamespace, nodeType);
            const set  = (name, value) => node.setAttribute(propNameTransform(name), transform(name, value));
            const get  = (name, value) => transform(name, node.getAttribute(propNameTransform(name)), transformTypes.read);
            const svg  = {
                node,
                nodeType,
                isPSVG   : true,
                set units(postFix) { units = postFix },
                get units() { return units },
            };
            const proxyHandler = {
                get(target, name) { return svg[name] !== undefined ? target[name] : get(name) },
                set(target, name, value) {
                    if (value !== null && typeof value === "object" && value.isPSVG) {
                        node.appendChild(value.node);
                        target[name] = value;
                        return true;
                    }
                    set(name, value);
                    return true;
                },
            };
            return new Proxy(svg, proxyHandler);
        })();
        Object.assign(PSVG, props);
        // Object.keys(props).forEach(key => PSVG[key] = props[key]);
        return PSVG;
    }
    return createSVG;
})();




/*      
    // all known nSVG node types
    const svgNodeTypes = "a,altGlyph,altGlyphDef,altGlyphItem,animate,animateColor,animateMotion,animateTransform,audio,canvas,circle,clipPath,color-profile,cursor,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,font,font-face,font-face-format,font-face-name,font-face-src,font-face-uri,foreignObject,g,glyph,glyphRef,hatch,hatchpath,hkern,iframe,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,missing-glyph,mpath,path,pattern,polygon,polyline,radialGradient,rect,script,set,solidcolor,stop,style,svg,switch,symbol,text,textPath,title,tref,tspan,unknown,use,video,view,vkern";
    
    // List of possible unit values Needs research
    const possibleUnitValue = "u2,u1,targetY,targetX,tabindex,stemv,stemh,speed,specularExponent,specularConstant,spacing,slope,seed,scale,rotate,refY,refX,radius,opacity,max,markerWidth,markerHeight,k4,k3,k2,k1,k,fy,fx,fr";

    // List of property names. 
    const svgPropNames = "lengthAdjust,kernelUnitLength,stdDeviation,accumulate,additive,allowReorder,alphabetic,amplitude,ascent,attributeName,attributeType,autoReverse,azimuth,baseFrequency,baseProfile,bbox,begin,bias,by,calcMode,class,clip,clipPathUnits,color,contentScriptType,contentStyleType,cursor,d,decelerate,descent,diffuseConstant,direction,display,divisor,dur,edgeMode,elevation,end,exponent,externalResourcesRequired,fill,filter,filterRes,filterUnits,format,from,g1,g2,glyphRef,gradientTransform,gradientUnits,hanging,href,id,ideographic,in,in2,intercept,kernelMatrix,kerning,keyPoints,keySplines,keyTimes,lang,limitingConeAngle,local,markerUnits,mask,maskContentUnits,maskUnits,mathematical,media,method,min,mode,numOctaves,offset,onabort,onactivate,onbegin,onclick,onend,onerror,onfocusin,onfocusout,onload,onmousedown,onmousemove,onmouseout,onmouseover,onmouseup,onrepeat,onresize,onscroll,onunload,operator,order,orient,orientation,origin,overflow,pathLength,patternContentUnits,patternTransform,patternUnits,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,spreadMethod,startOffset,stitchTiles,string,stroke,style,surfaceScale,systemLanguage,tableValues,target,textLength,to,transform,type,unicode,values,version,viewBox,viewTarget,visibility,widths,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,yChannelSelector,zoomAndPan";    
 
*/
/*
List of known SVG node types
const svgNodeTypes = "a,altGlyph,altGlyphDef,altGlyphItem,animate,animateColor,animateMotion,animateTransform,audio,canvas,circle,clipPath,color-profile,cursor,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistantLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,font,font-face,font-face-format,font-face-name,font-face-src,font-face-uri,foreignObject,g,glyph,glyphRef,hatch,hatchpath,hkern,iframe,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,missing-glyph,mpath,path,pattern,polygon,polyline,radialGradient,rect,script,set,solidcolor,stop,style,svg,switch,symbol,text,textPath,title,tref,tspan,unknown,use,video,view,vkern";

List of possible unit values
const possibleUnitValue = "u2,u1,targetY,targetX,tabindex,stemv,stemh,speed,specularExponent,specularConstant,spacing,slope,seed,scale,rotate,refY,refX,radius,opacity,max,markerWidth,markerHeight,k4,k3,k2,k1,k,fy,fx,fr"

const svgpropNames = 
"lengthAdjust,kernelUnitLength,stdDeviation,accumulate,additive,allowReorder,alphabetic,amplitude,ascent,attributeName,attributeType,autoReverse,azimuth,baseFrequency,baseProfile,bbox,begin,bias,by,calcMode,class,clip,clipPathUnits,color,contentScriptType,contentStyleType,cursor,d,decelerate,descent,diffuseConstant,direction,display,divisor,dur,edgeMode,elevation,end,exponent,externalResourcesRequired,fill,filter,filterRes,filterUnits,format,from,g1,g2,glyphRef,gradientTransform,gradientUnits,hanging,href,id,ideographic,in,in2,intercept,kernelMatrix,kerning,keyPoints,keySplines,keyTimes,lang,limitingConeAngle,local,markerUnits,mask,maskContentUnits,maskUnits,mathematical,media,method,min,mode,numOctaves,offset,onabort,onactivate,onbegin,onclick,onend,onerror,onfocusin,onfocusout,onload,onmousedown,onmousemove,onmouseout,onmouseover,onmouseup,onrepeat,onresize,onscroll,onunload,operator,order,orient,orientation,origin,overflow,pathLength,patternContentUnits,patternTransform,patternUnits,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,spreadMethod,startOffset,stitchTiles,string,stroke,style,surfaceScale,systemLanguage,tableValues,target,textLength,to,transform,type,unicode,values,version,viewBox,viewTarget,visibility,widths,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,yChannelSelector,zoomAndPan";

List of known XML formated names
"accent-height,alignment-baseline,arabic-form,baseline-shift,cap-height,clip-path,clip-rule,color-interpolation,color-interpolation-filters,color-profile,color-rendering,dominant-baseline,enable-background,fill-opacity,fill-rule,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,horiz-adv-x,horiz-origin-x,image-rendering,letter-spacing,lighting-color,marker-end,marker-mid,marker-start,overline-position,overline-thickness,panose-1,paint-order,pointer-events,rendering-intent,shape-rendering,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,text-anchor,text-decoration,text-rendering,underline-position,underline-thickness,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,vert-adv-y,vert-origin-x,vert-origin-y,word-spacing,writing-mode,x-height"




*/




