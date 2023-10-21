import {intro} from "./Intro.js";
import {play} from "./play.js";

const states = {};
var currentStateName, currentState, inFrame = false, stateChangePending = false, pendingName, lastMessage, lastMessageType = 0, messageTime;
var newMessage, newMessageType = 0;
const messageTypes = {
    none: 0,
    message: 1,
    warning: 2,
    error: 3,
}
const messageColors = ["#000","#0F0","#F90","#F00"];
const frameStartEvents = [];
const frameEndEvents = [];

const Aoids = {
	// the following are game related not code related messages
	set message(mes) { newMessageType < messageTypes.message && (newMessageType = messageTypes.message, newMessage = mes) },
	set warning(mes) { newMessageType < messageTypes.warning && (newMessageType = messageTypes.warning, newMessage = mes) },
	set error(mes) { newMessageType < messageTypes.error && (newMessageType = messageTypes.error, newMessage = mes) },
    displayMessage() {
        if (newMessage !== lastMessage && newMessageType > lastMessageType) {
            Aoids.gamesComs.textContent = lastMessage = newMessage;
            Aoids.gamesComs.style.color = messageColors[lastMessageType = newMessageType];
            messageTime = 200;
        }
         newMessageType = 0;
    },
	clearMessage() {
		Aoids.gamesComs.textContent = lastMessage = "";
		lastMessageType = messageTime = 0;
        newMessageType = 0;
	},
	time: 0,
    frame: 0,
	setup() {
		for(const name of Object.keys(states)) { states[name].setup && states[name].setup() }
	},
	frameStart(time) {
        Aoids.time = time;
        Aoids.frame ++;
        for (const event of frameStartEvents) { event.handler(event.data) }
        frameStartEvents.length = 0;
        inFrame = true;
    },
	frameEnd() {
		inFrame = false;
        for (const event of frameEndEvents) { event.handler(event.data) }
        frameEndEvents.length = 0;
		if (stateChangePending) {
			Aoids.state = pendingName;
			stateChangePending = false;
		}
        if(newMessageType) {
            Aoids.displayMessage()
        }
		if (messageTime) {
			messageTime --;
			if (messageTime <= 0) { Aoids.clearMessage() }
		}

	},
    eventTypes: {
        frameStart: 1,
        frameEnd: 2,
    },
    addEvent(type, handler, data) {
        if(type === Aoids.eventTypes.frameStart) { frameStartEvents.push({handler, data}) }
        else if(type === Aoids.eventTypes.frameEnd) { frameEndEvents.push({handler, data}) }
    },
	addState(name, state) { return states[name] = state },
	set state(name) {
        var stateTransferObj;
		if (name !== currentStateName) {
			if (inFrame) {
				stateChangePending = true;
				pendingName = name;
			} else {
				Aoids.keyboard && Aoids.keyboard.clear();
				currentState.end && (stateTransferObj = currentState.end());
				Aoids.clearMessage();
				currentState = states[name];
				currentStateName = name;
                Aoids.frame = 0;
				currentState.start && currentState.start(stateTransferObj);
				(Aoids.resized = currentState.resized || Aoids.defaultResized)();
				Aoids.updatePaused = currentState.updatePaused || Aoids.defaultUpdatePaused;
				Aoids.update = currentState.update || Aoids.defaultUpdate;
				Aoids.render = currentState.render || Aoids.defaultRender;
			}
		}
	},
	defaultResized() { },
	defaultUpdatePaused() { },
	defaultUpdate() { },
	defaultRender() { },
};
currentState = Aoids.addState("blank", {});
Aoids.addState("intro", intro);
Aoids.addState("play", play);


export {Aoids};
