"use strict";
    const CSSInjector = {
        css : ``,
        add(css) {CSSInjector.css += css},
        inject(){
            var styleNode = document.querySelector("#grooverGUI-style-element");
            if(styleNode === null){
                styleNode = document.createElement('style');
                styleNode.id = "grooverGUI-style-element";
                styleNode.innerHTML = CSSInjector.css;
                document.head.appendChild(styleNode);                
            }else{
                styleNode.innerHTML = CSSInjector.css;
            }
                
        }
    }



