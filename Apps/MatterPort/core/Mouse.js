

import {Common} from "../core/Common.js";
import {Vector, Vec2} from "../geometry/Vector.js";
const Mouse = (() => {
    const buttonMask = 0b111;
    const buttons = [1, 2, 4, 0b110, 0b101, 0b011, 0];      
    const MousePos = mouse => e => {
        mouse.pagePosOld.setVec(mouse.pagePos);
        mouse.pagePos.set(e.pageX, e.pageY);
        mouse.alt   = e.altKey;
        mouse.shift = e.shiftKey;
        mouse.ctrl  = e.ctrlKey;        
    }
    const MouseUp = mouse => e => {
        mouse.listeners.move(e);
        mouse.oldButton = mouse.button;
        mouse.button &= buttons[e.which + 2];        
    }
    const MouseDown = mouse => e => {
        mouse.listeners.move(e);
        mouse.oldButton = mouse.button;
        mouse.button |= buttons[e.which - 1];  
        
    }
    const MouseWheel = mouse => e => {
        e.preventDefault();
        mouse.wheel.x += e.deltaX;
        mouse.wheel.y += e.deltaY;  
    }

    
    class Mouse {
        #element;
        #bounds;
        #view;
        over = false;
        button = 0;
        oldButton = 0;
        alt = false;
        shift = false;
        ctrl = false;      
        constructor(element) {
            this.pagePos = Vector.Point();
            this.pagePosOld = Vector.Point();
            this.elementPos = Vector.Point();
            this.elementPosOld = Vector.Point();           
            this.elementDelta = Vector.Point();           
            this.worldPos = Vector.Point();
            this.worldPosOld = Vector.Point();
            this.worldDelta = Vector.Point();
            this.wheel = Vector.Point();
            this.wheelOld = Vector.Point();
            this.listeners = {
                move: MousePos(this),
                up: MouseUp(this),
                down: MouseDown(this),
                wheel: MouseWheel(this),
            };
            this.element = element;
            this.addEvents();
        }
        set view(view) {
            this.#view = view;
        }
        set element(element) {
            if (element && this.#element !== element) {
                this.removeEvents();
                this.#element = element;
                this.addEvents();
            }
            this.#bounds = this.#element.getBoundingClientRect();
        }
        removeEvents() {
            if (this.#element) {
                this.#element.removeEventListener('mousemove', this.listeners.move);
                this.#element.removeEventListener('mousedown', this.listeners.down);
                this.#element.removeEventListener('mouseup', this.listeners.up);
                this.#element.removeEventListener('mousewheel',this.listeners.wheel);
                this.#element.removeEventListener('DOMMouseScroll', this.listeners.wheel); 
                //this.#element.addEventListener('touchmove', );
                //this.#element.addEventListener('touchstart', );
                //this.#element.addEventListener('touchend', );                 
            }
        }
        addEvents() {
            this.#element.addEventListener('mousemove', this.listeners.move);
            this.#element.addEventListener('mousedown', this.listeners.down);
            this.#element.addEventListener('mouseup', this.listeners.up);
            this.#element.addEventListener('mousewheel',this.listeners.wheel);
            this.#element.addEventListener('DOMMouseScroll', this.listeners.wheel);
            //this.#element.addEventListener('touchmove', );
            //this.#element.addEventListener('touchstart', );
            //this.#element.addEventListener('touchend', );           
        }
        update() {
            this.elementPosOld.setVec(this.elementPos);
            this.elementPos.x = this.pagePos.x - this.#bounds.left - scrollX;
            this.elementPos.y = this.pagePos.y - this.#bounds.top - scrollY;
            this.elementDelta.setVec(this.elementPos).sub(this.elementPosOld);
            if (this.elementPos.x < 0 || this.elementPos.x >= this.#bounds.width || this.elementPos.y < 0 || this.elementPos.y >= this.#bounds.height) {
                this.over = false;
            } else { this.over = true }
            if (this.#view) {
                this.worldPosOld.setVec(this.worldPos);
                this.#view.toWorld(this.elementPos, this.worldPos);
                this.worldDelta.setVec(this.worldPos).sub(this.worldPosOld);
            }
        }   
    }
    return Mouse;
})();
const {keyboard, keys} = (()=>{
    const keys = {};
    const keyListeners = {};

    const API = {
        lastKey: undefined,
        addKey(code) {
            keys[code] = null;
        },
        removeKey(code) {
            delete keys[code];
        },
        addKeyListener(code, listener) {
            keyListeners[code] = listener;
        },
        removeKeyListener(code) {
            delete keyListeners[code];
        },
        
    };
    function keyEvent(event){
        API.lastKey = event.code;
        if (keys[event.code] !== undefined) {
            keys[event.code] = event.type === "keydown";
        }
        if (keyListeners[event.code] !== undefined) {
            event.type === "keydown" && keyListeners[event.code](event);
        }
    }
    
    document.addEventListener("keydown", keyEvent);
    document.addEventListener("keyup", keyEvent);
    return {keyboard:API, keys};
})();
export {Mouse, keyboard, keys};









