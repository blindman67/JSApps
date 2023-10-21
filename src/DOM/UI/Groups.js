
const groups = {};
function apply(groupName, fName, ...args) {
	if(groups[groupName]) {
		const l = groups[groupName].uiList;
		for (const rui of l) {
			rui[fName] instanceof Function && rui[fName](...args) 

		}
	}	
	
}
const Groups = {
	
	addUI(name, ui) {
		if(groups[name] === undefined) {
			groups[name] = {
				name,
				uiList: [],
			}
		}
		groups[name].uiList.push(ui);
	},
	remove(name) {
		if(groups[name]) {
			groups[name] = undefined;
		}
	},
	removeUI(name, ui) {
		if(groups[name]) {
			const l = groups[name].uiList;
			let i = 0;
			while (i < l.length) {
				if (l[i] === ui) {
					l.splice(i,1);
				} else { i ++ }
			}
			if(l.length === 0) {
				RadioGroups.removeGroup(name);
			}
		}
	},
	radio(name, ui) {
		if(groups[name]) {
			const l = groups[name].uiList;
			for (const rui of l) {
				if (rui !== ui) { rui.checked = false }
			}
			ui.checked = true;
		}
	},
	disable(name) { apply(name, "disable") },
	enable(name) { apply(name, "enable") },
	
	
	
	
};

export {Groups};