const namedStates = {};
var currentState, currentStateName;
const stub = ()=>{};

const stateManager = {
	addState(name, state) {
		namedSates[name] = state;
		state.name = name;
		!state.update && (state.update = stub);
		!state.render && (state.render = stub);
	},
	get state() { return currentState },
	set state(name) {
		if (currentState && currentState.nextState) {
			name = currentState.nextState;
		}
		if (namedStates[name] && currentStateName !== name) {
			currentState.end && currentState.end();
			currentStateName = name;
			currentState = namedStates[name];
			currentState.start && currentState.start();
			stateManager.render = currentState.render;
			stateManager.update = currentState.update;
			return currentState;
		}
	}
	render: stub,		
	update: stub,
}

export {stateManager};