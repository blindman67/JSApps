
export {Docker};
function Docker(range = 16, border = 2) {
	this.range = range ** 2;
	this.border = border;
	this.dialogs = new Map();
}
Docker.prototype = {
	isDocked(id) {
		const d = this.dialogs.get(id);
		return d && d.above !== -1;
	},
	hasDocked(id) {
		const d = this.dialogs.get(id);
		return d && d.below !== -1;
	},	
	canDock(id) {
		const d = this.dialogs.get(id);
		if (!d || d.above > -1) { return }
		const y = d.dialog.y;
		const x = d.dialog.x;
		var min = this.range;
		var minId;
		for(const d of this.dialogs.values()) {
			if(id !== d.id) {
				const dx = d.dialog.x - x;
				const dy = (d.dialog.y + d.dialog.height) - y;
				const dist = dx * dx + dy * dy;
				if (dist < min) {
					min = dist;
					minId = d.id;
				}			
			}
		}
		return minId;
	},
	getTotalStackHeight(id) {
		const topId = this.topOfStack(id);
		if(topId !== undefined) {
			return this.getStackHeight(topId);
		}
	},
	getStackHeight(id) {
		var d = this.dialogs.get(id);
		var h = 0;
		var c= this.dialogs.size;
		while (d) {
			h += d.dialog.height + this.border;
			if (d.below === -1) { return h }
			d = this.dialogs.get(d.below);
			if(c < 0) { throw Error("Cyclic dock 'getStackHeight' can not continue") }
			c--;
		}
		return h;		
		
	},
	dock(id, toId) {
		const d = this.dialogs.get(id);
		const dBottom = this.dialogs.get(this.bottomOfStack(id));
		const da = this.dialogs.get(toId);
		if (d && da) {
			const dab = this.dialogs.get(da.below);
			if (dab) {
				dab.above = dBottom.id;
				dBottom.below = dab.id
			}
			da.below = d.id;
			d.above = da.id;
			this.updateBelow(this.topOfStack(toId));
		}
	},
	update(id) {
		this.updateBelow(this.topOfStack(id));
	},
	topOfStack(id) {
		var d = this.dialogs.get(id);
		var c= this.dialogs.size;
		while (d) {
			if (d.above === -1) { return id }
			id = d.above;
			d = this.dialogs.get(id);
			if(c < 0) { throw Error("Cyclic dock 'topOfStack' can not continue") }
			c--;
		}
		return id;
	},
	bottomOfStack(id) {
		var d = this.dialogs.get(id);
		var c= this.dialogs.size;
		while (d) {
			if (d.below === -1) { return id }
			id = d.below;
			d = this.dialogs.get(id);
			if(c < 0) { throw Error("Cyclic dock 'bottomOfStack' can not continue") }
			c--;
		}
		return id;
	},	
	dialogsInStack(id) {
		var d = this.dialogs.get(id);
		const dialogs = [];
		if (d) {
			d = this.dialogs.get(this.topOfStack(id));
			let c = this.dialogs.size;
			while (d) {
				dialogs.push(d.dialog);
				if (d.below === -1) { return dialogs }
				d = this.dialogs.get(d.below);
				if(c < 0) { throw Error("Cyclic dock 'dialogInStack' can not continue") }
				c--;
			}
		}
		return dialogs;
	},
	add(id, dialog) { this.dialogs.set(id, {id, dialog, below: -1, above: -1}) },
	updateAbove(id, cycCount) {
		if(cycCount < 0) { throw Error("Cyclic dock 'updateAbove' can not continue") }
		const d = this.dialogs.get(id);
		if (d) {
			const da = this.dialogs.get(d.above);
			if (da) {
				da.dialog.x = d.dialog.x;
				da.dialog.y = d.dialog.y - (da.dialog.height + this.border)
				da.dialog.fixPos();
				this.updateAbove(da.id, cycCount-1);
			}
		}
	},
	updateBelow(id, cycCount) {
		if(cycCount < 0) { throw Error("Cyclic dock 'updateBelow' can not continue") }
		const d = this.dialogs.get(id);
		if (d) {
			const db = this.dialogs.get(d.below);
			if (db) {
				db.dialog.x = d.dialog.x;
				db.dialog.y = d.dialog.y + (d.dialog.height + this.border); 
				db.dialog.fixPos();
				this.updateBelow(db.id, cycCount-1);
			}
		}
	},
	undockBelow(id) {
		const d = this.dialogs.get(id);
		if (d) {
			const db = this.dialogs.get(d.below);
			if (db) {
				db.above = -1;
				d.below = -1;
				return db.dialog;
			}
		}
	},
	undock(id) {
		const d = this.dialogs.get(id);
		if (d) {
			const da = this.dialogs.get(d.above);
			if (da) {
				da.below = -1;
				d.above = -1;
				return da.dialog;
			}
		}
	},
	remove(id) { 
		const d = this.dialogs.get(id);
		if (d) {
			const db = this.dialogs.get(d.below);
			const da = this.dialogs.get(d.above);
			if (db && !da) {
				db.above = -1;				
			} else if(!db && da) {
				da.below = -1;
			} else if(db && da) {
				db.above = da.id;
				da.below = db.id;
				this.updateBelow(db.id, this.dialogs.size);
				this.updateAbove(da.id, this.dialogs.size);
			}
			this.dialogs.delete(id);
		}
	},
};