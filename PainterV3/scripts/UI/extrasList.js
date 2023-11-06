"use strict";
function Fold() {  // Prototype set in extrasList
    this.items = [];

}
const extrasList = (()=>{
    const FOLD_INDENT_SIZE = 15;
    const buttonMap = new Map();
    var index = 0;
    var tabElement;
    var flasher;
    var index;
    var indent = 0;
    var customCommandId;
    const fCommands = new Map();
    var lastOpen = null;
    const optionButtons = {
        option1 : {},
        option2 : {},
        option3 : {},
        option4 : {},
    };
    const buttonParts = {
        helpString() { return this.help },
        toString() { return this.name },
    }
    Fold.prototype = {
        each(cb) { for(const item of this.items) { cb(item) } },
        find(cb) { for(const item of this.items) { if(cb(item) !== undefined) { return item } } },
        flash(name, end = false) {  // end is used to stop endless recursion
            if(!end){
                if(this.boss && this.boss.flash) {
                    this.boss.flash(name, true);
                }
            }
        },
        hasFold(fold) {
            for(const item of this.items) {
                if(item.isFold && item.hasFold(fold)) { return true }
                if(item === fold) { return true }
            }
            return false
        },
        init(item) {
            item.boss = this.boss;
            item.owner = this;
            this.items = [];
            this.list = item.list;
            this.item = item;
            this.indent = item.indent;
            this.list.style.textIndent = this.indent * FOLD_INDENT_SIZE + "px";

        },
        close(){
            if(this.isOpen){
                //this.list.classList.add("foldClosed");
                this.each(item => {
                    if(item.isFold) { item.close() }
                    item.element.classList.add("hideItem");
                })
                this.isOpen = false;
                const openClose =this.isOpen ? textIcons.triangleDown : textIcons.triangleRight;
                this.element.textContent = openClose + this.item.toString();
            }
        },
        toggle() {
            if(this.isOpen) {
                API.clearOptionsAll(); // Not finnished
                this.close();
                this.boss.lastOpen = null;
                return;
            }else {
                while(this.boss.lastOpen !== null && this.boss.lastOpen !== this){
                    if(this.boss.lastOpen.hasFold(this)){ break }
                    this.boss.lastOpen.close();
                    this.boss.lastOpen = this.boss.lastOpen.owner;
                }
                //this.list.classList.remove("foldClosed");
                this.each(item => item.element.classList.remove("hideItem"));
                this.isOpen = true;
                this.boss.lastOpen = this;
                API.clearOptionsAll(); // Not finnished
                if(this.source && this.source.foldInfo && this.source.foldInfo.onOpenFold) {
                    this.source.foldInfo.onOpenFold(this);
                }
            }
            const openClose =this.isOpen ? textIcons.triangleDown : textIcons.triangleRight;
            this.element.textContent = openClose + this.item.toString();
        },
        update() {
            if(flasher === undefined) {
                flasher = elementFlasher(tabElement, {newItem : "tabFlashNew"});
                this.flash = function(name) { flasher(name) };
            }

            this.each(listItem => {
                const item = listItem.item;
                const element = listItem.element;
                if(listItem.isFold){ listItem.update() }
                const openClose = listItem.isFold ? (listItem.isOpen ? textIcons.triangleDown : textIcons.triangleRight) : "";
                element.textContent = openClose + item.toString();
                if(item.helpString){ element.title = item.helpString() }
                else { element.title = "" }
            });
        },
        addFold(button){
            if(this.indent !== undefined){
                button.indent = this.indent + 1;
            }else{
                button.indent = 0;
            }
            button.commandId = commands.extrasFold;
            const fold = new Fold();
            fold.boss = this.boss;
            fold.owner = this.isAPI ? null : this;
            fold.element = this.list.addFoldItem(button);
            if(button.indent > 0){ fold.element.classList.add("hideItem"); }
            this.items = this.items || [];
            fold.init(button);
            this.items.push(fold)
            fold.element.listItem = fold;
            this.flash("newItem");
            return fold;
        },
        add(addItem){
            var item;
            const disabled = addItem.source.info?.disabled === true;
            addItem.boss = this.boss;
            addItem.owner = this;
            this.items = this.items || [];
            this.items.push(item = { item : addItem, element : this.list.addItem(addItem.commandId, addItem.toString()),});
            if(this.isFold){ item.element.style.textIndent =  (this.indent + 1) * FOLD_INDENT_SIZE + "px" }
            addItem.listItem = item;
            item.element.listItem = item;
            item.element.classList.add("hideItem");
            disabled && item.element.classList.add("disabledItem");
            this.flash("newItem");
        },
        removeItem(item){
            const index = item.item.owner.items.findIndex(item => item.item.objName === item.item.objName);
            if(index > -1){
                item.item.owner.items.splice(index,1);
                item.element.parentElement.removeChild(item.element);
                return item;
            }
        },
        getItemPathByName(name, path = []){
           const item = this.find(listItem => {
                var item = listItem.item;
                if(item.objName === name){ return true }
                if(listItem.isFold) {
                    const found = listItem.getItemPathByName(name, path);
                    if(found) {
                        path.push(listItem.item.name);
                        return true;
                    }
                }
            });
            return item ? path : undefined;
        },
        getItemByName(name){
            return this.find(listItem => {
                var item = listItem.item;
                if(item.objName === name){ return item }
                if(listItem.isFold) {
                    item = listItem.getItemByName(name);
                    if(item) { return item }
                }
            });
        },
        getByName(name){
            return this.find(listItem => {
                var item = listItem.item;
                if(item.objName === name){ return item }

                if(listItem.isFold && !dontCheckFolds) {
                    item = listItem.getItemByName(name);
                    if(item) { return item }
                }
            });
        },
        updateByObjName(name, text, help){
            this.each(listItem => {
                const item = listItem.item;
                const element = listItem.element;
                if(listItem.isFold) {
					if(item.name === name) {
						if(text !== undefined) {
							item.name = text;
							const openClose = listItem.isFold ? (listItem.isOpen ? textIcons.triangleDown : textIcons.triangleRight) : "";
							element.textContent = openClose + item.toString();
						}
						if(help !== undefined) {
							item.help = help;
							element.title = item.helpString();
						}
					} else {
						listItem.updateByObjName(name, text, help)
					}
				} else if(item.objName === name) {
                    if(text !== undefined){
                        element.textContent = text;
                    }
                    if(help !== undefined){
                        element.title = help;
                    }
                }
            });
        },
        initBehaviour() {
            this.each(listItem => { if(listItem.isFold){ listItem.initBehaviour() }  });
            if(this.isFold && this.source && this.source.foldInfo.init) { this.source.foldInfo.init() }
        },
        addFoldObject(obj){
            var item;
            const keys = Object.keys(obj);
            for(const name of keys) {
                if(name !== "foldInfo" && name !== "itemInfo"){
					const desc = obj[name];
                    if(typeof desc.call === "function"){
                        //fCommands.set(customCommandId, desc.call);
                        let item;
                        this.add(item = {
                            source : desc,
                            commandId : this.boss.customCommandId,
                            objName : name,
                            name : desc.name ? desc.name : objNameToHuman(name),
                            help : desc.help ? desc.help : "",
                            helpString : buttonParts.helpString,
                            toString :  buttonParts.toString,
                        });
                        item.source.owner = item;
                        const call = desc.call.bind(this)
                        this.boss.fCommands.set(this.boss.customCommandId, (...data) => { 
                            if (item.listItem.item.source.info?.disabled === true) {
                                log.warn("This function has been disabled!");
                            } else { call(item.listItem, ...data) }
                        })
                        currentPath[name] = this.boss.customCommandId;
                        this.boss.customCommandId ++;
                    }else if(desc !== null && typeof desc === "object"){
                        item = this.addFold( {
                            name : objNameToHuman(name),
                            toString : buttonParts.toString,
                        });
                        if(desc.foldInfo){
							const fi = desc.foldInfo;
                            item.source = desc
                            fi.fold = item;
							if (fi.foldClass) { item.list.classList.add(fi.foldClass) }
							if (fi.help) { item.element.title = fi.help ? fi.help : "" }
                        }
                        if(currentPath[name] === undefined) {
                            currentPath[name] = {};
                        }
                        const cPath = currentPath;
                        currentPath = currentPath[name];
                        item.addFoldObject(desc);
                        currentPath = cPath;
                    } else  if(typeof desc === "function"){
                        this.boss.fCommands.set(customCommandId,desc);
                        this.add( {
                            commandId : this.boss.customCommandId,
                            name : objNameToHuman(name),
                            toString : buttonParts.toString,
                        });
                        currentPath[name] = this.boss.customCommandId;
                        this.boss.customCommandId ++;
                    }
                }
            }
            if(this.isAPI) {
                //this.update();
            }
            return item;
        },
        isOpen : false,
        isFold : true,
        customCommandId : 0,

    }
    var currentPath = {};
    const API = {
        list : null,
        ...Fold.prototype,
        customCommandId : commands.extrasCustom,
        lastOpen : null,
        flash() {},  // can be omitted. Used to flash UI on changes
        paths: currentPath,
        fCommands,  // A Map relating commandId to item callback function
        isAPI : true,  // ALWAY set this to true
        ready(pannel) {
            tabElement = pannel.titleElement;

            this.list = buttonMap.get(commands.extras).element;
            optionButtons.option1.but = buttonMap.get(commands.extrasOption1);
            optionButtons.option2.but = buttonMap.get(commands.extrasOption2);
            optionButtons.option3.but = buttonMap.get(commands.extrasOption3);
            optionButtons.option4.but = buttonMap.get(commands.extrasOption4);

        },
        callByCommand(commandId, ...data) {
            if(commandId >= commands.extrasCustom){
                const commandCall = fCommands.get(commandId);
                if(typeof commandCall === "function") { commandCall(...data) }
            }

        },
        command(commandId,button,event){
            if(commandId >= commands.extrasOption1 && commandId <= commands.extrasOption4){
                const op = optionButtons["option" + (commandId - commands.extrasOption1 + 1)];
                if(op){
                    if(op.callback){ op.callback(commandId) }
                }
            }
            if(commandId === commands.extrasFold){
                event.target.listItem.toggle();
            }else if(commandId >= commands.extrasCustom){
                const commandCall = fCommands.get(commandId);
                if(typeof commandCall === "function") { commandCall() }
            }
        },
        setButtons(buttons){
            for (const but of buttons) { buttonMap.set(but.command, but) }
            return buttons;
        },
        setupOptionsButton(optionId,text,help,callback){
            const op = optionButtons["option" + optionId];
            if(op){
                op.but.setHelp(help);
                op.but.element.textContent = text;
                op.callback = callback;
            }
        },
        clearOptionsButton(optionId){
            const op = optionButtons["option" + optionId];
            if(op){
                op.but.setHelp("");
                op.but.element.textContent = "?";
                op.callback = undefined;
            }
        },
        clearOptionsAll(optionId){
            API.clearOptionsButton(1);
            API.clearOptionsButton(2);
            API.clearOptionsButton(3);
            API.clearOptionsButton(4);
        },

    };
    API.boss = API;
    return API;
})();