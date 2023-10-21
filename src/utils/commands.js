const commandMap = new Map();
const commands = {
	add(id, options) {
		if(commandMap.has(id)) {
			
		} else { commandMap.set(id, options) }
	},
	remove(...ids) {
		for (const id of ids) { commandMap.delete(id) }
	},
	has(id) { return commandMap.has(id) },
	get(id) { return commandMap.get(id) },
		
};
export {commands};

