"use strict";

const Filters = (()=>{
    
    const filterTypes = ["blur","shadow"]
    const shared = {
        zIndexShadow : 0,
        get zIndex() { return this.zIndexShadow },
        set zIndex(value) { 
            if(this.zIndexShadow !== value) { this.owner.orderDirty = true }
            this.zIndexShadow = value;
        },
        activeShadow : false,
        get active() { return this.activeShadow },
        set active(value) { 
            if(this.activeShadow !== (value === true)) { this.owner.dirty = true }
            this.activeShadow = value === true;
        },
            
        
    };
    function Shadow(owner) {
        var x = 0;
        var y = 0;
        var a = 0;
        var r = 0;
        var g = 0;
        var b = 0;
        var blur = 0;
        var css = "#00000088";
        var zIndex = 0;
        var active = false;
        function update(){
            active = a > 0;
            if(active){
                if(owner.update) { owner.update() }
            }
        }
            
        return  {
            owner,
            get filter() {                
                if(a === 0 || active === false){
                    return "";
                }
                this.css = "rgba(" + r + "," + g + ","+ b + "," + a + ")";            
                return `drop-shadow(${x}px ${y}px ${blur}px ${css})`;            
            },
            get color() { return css },
            set color(value) {
                if(css !== value){
                    this.owner.dirty = true;
                    if(value[0] === "#"){
                        if(value.length === 4){
                            r = parseInt(value.substr(1,1) + value.substr(1,1),16);
                            g = parseInt(value.substr(2,1) + value.substr(1,1),16);
                            b = parseInt(value.substr(3,1) + value.substr(1,1),16);
                        }else if(value.length === 5){
                            r = parseInt(value.substr(1,1) + value.substr(1,1),16);
                            g = parseInt(value.substr(2,1) + value.substr(1,1),16);
                            b = parseInt(value.substr(3,1) + value.substr(1,1),16);
                            a = parseInt(value.substr(4,1) + value.substr(1,1),16) / 255;
                        }else if(value.length === 7){
                            r = parseInt(value.substr(1,2),16);
                            g = parseInt(value.substr(3,2),16);
                            b = parseInt(value.substr(5,2),16);
                        }else {
                            r = parseInt(value.substr(1,2),16);
                            g = parseInt(value.substr(3,2),16);
                            b = parseInt(value.substr(5,2),16);
                            a = parseInt(value.substr(7,2),16) / 255;
                        }
                    }
                    css = value;
                    update();
                }
            },
            get red() { return r },
            set red(value) { 
                if(r !== value){
                    this.owner.dirty = true;
                    r = value;
                    update();
                }
            },
            get green() { return g },
            set green(value) { 
                if(g !== value){
                    this.owner.dirty = true;
                    g = value;
                    update();
                }
            },
            get blue() { return b },
            set blue(value) { 
                if(b !== value){
                    this.owner.dirty = true;
                    b = value;
                    update();
                }
            },
            get alpha() { return a },
            set alpha(value) { 
                if(r !== value){
                    this.owner.dirty = true;
                    a = value;
                    update();
                }
            },
            get x() { return x },
            set x(value) { 
                if(x !== value){
                    this.owner.dirty = true;
                    x = value;
                    update();
                }
            },
            get y() { return y },
            set y(value) { 
                if(y !== value){
                    this.owner.dirty = true;
                    y = value;
                    update();
                }
            },
            get blur() { return blur },
            set blur(value) { 
                if(blur !== value){
                    this.owner.dirty = true;
                    blur = value;
                    update();
                }
            },
            get zIndex() { return zIndex },
            set zIndex(value) { 
                if(zIndex !== value) { this.owner.orderDirty = true }
                zIndex = value;
            },
            get active() { return active },
            set active(value) { 
                if(active !== (value === true)) { this.owner.dirty = true }
                active = value === true;
            },
        };   
        
        
    }
    /*function Blur(owner) {
        var amount = null;
        var zIndex = 0;
        var active = false;
        return {
            owner,
            get filter() {
                if(amount === 0 || active === false){
                    return "";
                }
                return "blur(" + amount + "px)";
            },
            get amount() { return amount },
            set amount(value) { 
                if(amount !== value){
                    this.owner.dirty = true;
                    amount = value;
                    active = value > 0;
                }
            },
            get zIndex() { return zIndex },
            set zIndex(value) { 
                if(zIndex !== value) { this.owner.orderDirty = true }
                zIndex = value;
            },
            get active() { return active },
            set active(value) { 
                if(active !== (value === true)) { this.owner.dirty = true }
                active = value === true;
            },
        };
    }       */
    
    
    function FX(name,unit,min,zero,max,owner) {
        var amount = zero;
        var zIndex = 0;
        var active = false;
        return {
            owner,
            get filter() {
                if(amount === 0 || active === false){
                    return "";
                }
                return name + "(" + amount + unit + ")";
            },
            get amount() { return amount },
            set amount(value) { 
                if(value < min){ value = min }
                if(value > max){ value = max }
                if(amount !== value){
                    this.owner.dirty = true;
                    amount = value;
                    active = value !== zero;
                }
            },
            get zIndex() { return zIndex },
            set zIndex(value) { 
                if(zIndex !== value) { this.owner.orderDirty = true }
                zIndex = value;
            },
            get active() { return active },
            set active(value) { 
                if(active !== (value === true)) { this.owner.dirty = true }
                active = value === true;
            },
        };
    }        
            




    function Filters(owner){
        this.owner = owner;
        this.init();
    }
    Filters.prototype = {
        init() {
            this.shadow = Shadow(this);
            this.blur = FX("blur","px",0,0,128,this);
            this.brightness = FX("brightness","%",0,100,200,this);
            this.contrast = FX("contrast","%",0,100,200,this);
            this.grayscale = FX("grayscale","%",0,0,100,this);
            this.invert = FX("invert","%",0,0,100,this);
            this.saturate = FX("saturate","%",0,100,200,this);
            this.sepia = FX("sepia","%",0,0,100,this);
            this.hue = FX("hue-rotate","deg",-360,0,360,this);
            //this.invert = FX("invert","%",0,0,100,this);
            this.order = [];
            
        },
        
        add(name, zIndex = this.order.length){
            if(!this.order.some(filter => filter.name === name)){
                if(this[name]){
                    this.order.push({
                        get zIndex() { return this.owner[name].zIndexShadow }, 
                        name, 
                        owner : this
                        
                    });
                    this[name].zIndex = zIndex;
                }
            }
        },
        update() {
            if(this.orderDirty){
                this.order.sort((a,b) => a.zIndex - b.zIndex);
                this.orderDirty = false;
            }
            if(this.dirty){
                    
                var space = "";
                var filterString = ""
                this.order.forEach(filter => {
                    var str = this[filter.name].filter;
                    if(str !== ""){
                        filterString += space + str;
                        space = " ";
                    }
                });
                if(filterString === "") { this.value = "none" }
                else { this.value = filterString }
                if(this.owner.filter !== undefined){ this.owner.filter = this.value }
                this.dirty = false;
            }
        },
        orderDirty : true,
        dirty : true,
        value : "none",    

        
    }
    return Filters;
})();