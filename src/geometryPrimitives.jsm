import {} from "./utils/MathExtensions.jsm";
import {Vec3} from "./Vec3.jsm";

const AXIS_IDX = {x: 0, y: 1, z: 2};
const v1 = new Vec3(), v2 = new Vec3(), v3 = new Vec3(), v4 = new Vec3(), v5 = new Vec3(), v6 = new Vec3(), v7 = new Vec3();
const debugVecs = [];

const faceInds = (mesh, fInd) => ([mesh.indices[fInd * 3], mesh.indices[fInd * 3 + 1],  mesh.indices[fInd * 3 + 2]]);
const hasFace = (mesh, i1, i2, i3) => {
	var i = 0;
	while (i < mesh.indices.length) {
		if ((mesh.indices[i] === i1 && mesh.indices[i + 1] === i2 && mesh.indices[i + 2] === i3) || 
			(mesh.indices[i] === i2 && mesh.indices[i + 1] === i3 && mesh.indices[i + 2] === i1) || 
			(mesh.indices[i] === i3 && mesh.indices[i + 1] === i1 && mesh.indices[i + 2] === i2)) {
			return true;
		}
		i += 3;
	}
	return false;
}
const pointVert = (mesh, i, p) => p.fromArray(mesh.verts, i * 3);
const edgeVerts = (mesh, i1, i2, p1, p2) => {p1.fromArray(mesh.verts, i1 * 3); p2.fromArray(mesh.verts, i2 * 3)};
const faceVerts = (mesh, i1, i2, i3, p1, p2, p3) => {p1.fromArray(mesh.verts, i1 * 3); p2.fromArray(mesh.verts, i2 * 3); p3.fromArray(mesh.verts, i3 * 3)};
const copyVert = (mesh, i, p1) => {
	const ind = mesh.verts.length / 3;
	mesh.verts.push(p1.x, p1.y, p1.z);
	mesh.normals && mesh.normals.push(mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2]);
	mesh.maps && (mesh.named.maps.size === 2 ? mesh.maps.push(mesh.maps[i * 3], mesh.maps[i * 3 + 1]) : mesh.maps.push(mesh.maps[i * 3], mesh.maps[i * 3 + 1], mesh.maps[i * 3 + 2]));
	return ind;
}
const faceNorm = (mesh, fInd) => {
	const [a, b, c] = faceInds(mesh, fInd);
	v1.fromArray(mesh.verts, b * 3).sub(v2.fromArray(mesh.verts, a * 3));
	v2.fromArray(mesh.verts, c * 3).sub(v3.fromArray(mesh.verts, a * 3));
	return v1.cross(v2).normalize();
}
const vertsToPath = (mesh, vertInds) => {
	const path = [];
	for(const vInd of vertInds) {
		path.push(mesh.verts[vInd * 3], mesh.verts[vInd * 3 + 1], mesh.verts[vInd * 3 + 2]);
	}
	return path;
}
const vertsToFacesInside = (mesh, vertInds) => {
	const faceIds = new Set();
	var i, j = 0;
	while(j < vertInds.length) {
		pointVert(mesh, vertInds[j], v1);
		pointVert(mesh, vertInds[(j + 1) % vertInds.length], v2);
		v2.sub(v1);
		const vInd = vertInds[j];
		i = 0;
		while(i < mesh.indices.length) {
			if(mesh.indices[i] === vInd) {
				const fId = i / 3 | 0;
				if (!faceIds.has(fId)) {
					const nextId1 = fId * 3 + ((i % 3 + 1) % 3);
					const nextId2 = fId * 3 + ((i % 3 + 2) % 3);
					pointVert(mesh, mesh.indices[nextId1], v3);
					pointVert(mesh, mesh.indices[nextId2], v4);
					if (v2.dot(v3.sub(v1)) >= 0 && v2.dot(v4.sub(v1)) >= 0) {
						faceIds.add(fId);
					}
				}
			}
			i++;
		}
		j++;
	}
	return [...faceIds.values()];
}



function Mesh(data = []) {
	this.fields = [];
	this.indices = data;
	this.named = {};  // named fields eg verts, normals, maps (texture UV) etc...
	this.selections = {};
	this.namedSelections = [];
}
Mesh.prototype = {
	addField(name, size, data = []) {
		const idx = this.fields.findIndex(f => f.name === name);
		if (idx > -1) { this.fields.splice(idx, 1) }
		this[name] = data;
		this.fields.push(this.named[name] = {name, size, idx: 0});
		return this;
	},
	clearSelection(selName) {
		delete this.selections[name];
		this.namedSelections.length = 0;
		this.namedSelections.push(Object.keys(this.selections));
	},
	createSelection(selName, field) {
		if (!this.selections[selName]) {
			if (field === "faces" || this.names[field]) {
				this.selections[selName] = {
					name: selName,
					field,
					ids: new Set(),
					select(...ids) {
						for(const id of ids) { this.ids.add(id) }
					},
					get isUpdating() { return this.removeIds !== undefined && this.newIds !== undefined },
					updating(start = true) {
						if (start) {
							this.newIds = new Set();
							this.removeIds = new Set();
						} else {
							if (this.removeIds && this.newIds) {
								for (const id of this.removeIds.values()) {
									this.ids.delete(id);
								}
								delete this.removeIds;
								for (const id of this.newIds.values()) {
									this.ids.add(id);
								}
								delete this.newIds;
							}
						}
						
					},
					remove(id) {
						if (this.isUpdating) {
							if(this.ids.has(id)) {
								this.removeIds(id);
							}
						} else {
							if(this.ids.has(id)) { this.ids.delete(id) }
						}
					},
					replace(id, ...newIds) {
						if (this.isUpdating) {
							if(this.ids.has(id)) {
								this.removeIds.add(id);
								for (const nid of newIds) { this.newIds.add(nid) }
							}
						}
					},
				};
				this.namedSelections.length = 0;
				this.namedSelections.push(Object.keys(this.selections));
				return this.selections[selName];
			}
		}
	},
	eachSelectionField(field, cb) { for(const name of this.namedSelections) { this.selections[name].field === field && cb(this.selections[name]) } },
	eachSelection(cb) { for(const name of this.namedSelections) { cb(this.selections[name]) } },
	
	vet() {
		if (!this.indices.length) { throw new Error("Mesh error. Does not contain any faces") }
		if (!this.named.verts) { throw new Error("Mesh error. Does not contain 'verts' data") }
		if (! Array.isArray(this.verts)) { throw new Error("Mesh error. Missing or Invalid data array 'verts'") }
		const numVerts = this.verts.length / this.named.verts.size;
		for (const f of this.fields) {
			if (! Array.isArray(this[f.name])) { throw new Error("Mesh error. Missing or Invalid data array '"+f.name+"'") }
			if (this[f.name].length / f.size !== numVerts) { throw new Error("Mesh error. Invalid data array size '"+f.name+"'") }
		}
		const checkIndice = ind => {
			if (isNaN(ind)) { throw new Error("Mesh error. Indice is not a number") }
			if (ind < 0) { throw new Error("Mesh error. Invalid indice") }
			if (ind >= numVerts) { throw new Error("Mesh error. Invalid indice") }
		}
		
		var i = 0, vertInds = [];
		while (i < numVerts) { vertInds.push(0); i++ }
		i = 0;
		while (i < this.indices.length) {
			const [i1, i2, i3] = faceInds(this, i / 3);
			checkIndice(i1);
			checkIndice(i2);
			checkIndice(i3);
			if (i1 === i2 || i1 === i3 || i2 === i3) { throw new Error("Mesh error. Zero area face") }
			vertInds[i1] ++;
			vertInds[i2] ++;
			vertInds[i3] ++;
			faceVerts(this, i1, i2, i3, v1, v2, v3);
			if (v1.distanceFrom(v2) < Math.EPSILON_HIGH || v1.distanceFrom(v3) < Math.EPSILON_HIGH || v3.distanceFrom(v2) < Math.EPSILON_HIGH) {
				throw new Error("Mesh error. Face area below safe precision") 
			}
			i += 3;
		}		
		if (vertInds.includes(0)) { throw new Error("Mesh error. Unreferenced data") }
		
	}
};

const getFacesByEdge = (mesh, a, b, found = new Set()) => {
	const pa = mesh.indices;
	var idx = 0;
	while (idx < pa.length) {
		if(!found.has(idx / 3)) {
			if((pa[idx] === a || pa[idx + 1] === a || pa[idx + 2] === a) && 
			   (pa[idx] === b || pa[idx + 1] === b || pa[idx + 2] === b)) {
				   found.add(idx / 3);
			}
		}
		idx += 3;
	}
	return found;
}
const getFaceByEdge = (indices, a, b, idx) => {
	const pa =indices;
	var i = 0;
	while (i < pa.length) {
		if(i !== idx) {
			if((pa[i] === a || pa[i + 1] === a || pa[i + 2] === a) && 
			   (pa[i] === b || pa[i + 1] === b || pa[i + 2] === b)) {
				   return i;
			}
		}
		i += 3;
	}
}
function getFacesByind(mesh, ind) {
	var i = 0;
	const found = [];
	while(i < mesh.indices.length) {
		if(mesh.indices[i] === ind || mesh.indices[i + 1] === ind || mesh.indices[i + 2] === ind) {
			found.push(i);
		}
		i ++;
	}
	return found;
}
function isPointInsideXZ(p1, p2, p3, p) {
	var x1 = p2.x - p1.x;
	var z1 = p2.z - p1.z;
	var x = p.x - p1.x;
	var z = p.z - p1.z;
	const u = (x1 * z - z1 * x) > 0;
	x1 = p3.x - p2.x;
	z1 = p3.z - p2.z;
	x = p.x - p2.x;
	z = p.z - p2.z;
	const u1 = (x1 * z - z1 * x) > 0;
	x1 = p1.x - p3.x;
	z1 = p1.z - p3.z;
	x = p.x - p3.x;
	z = p.z - p3.z;
	const u2 = (x1 * z - z1 * x) > 0;
	return u && u1 && u2;
}	
function meshPath(mesh, path, reverse = false) {  // Modified Ear clip triangulation. Not optimised. Clips ear with largest internal angle each pass
	var i, j, max, failed, found, creating = true;
	const v1 = new Vec3(), v2 = new Vec3(), v3 = new Vec3(), v4 = new Vec3();// oPath = [...path];
	while (creating) {
		creating = false;
		i = 0;
		found = undefined;
		const len = path.length;
		max = -1;
		while (i < len) {
			v2.fromArray(mesh.verts, path[(i + 1) % len] * 3);
			v1.fromArray(mesh.verts, path[i] * 3).sub(v2).normalize();
			v3.fromArray(mesh.verts, path[(i + 2) % len] * 3).sub(v2).normalize();
			const c = v1.crossXZ(v3);
			if (Math.abs(c) > max) {
				if ((!reverse && c < 0) || (reverse && c > 0)) {
					v1.fromArray(mesh.verts, path[i] * 3);
					v3.fromArray(mesh.verts, path[(i + 2) % len] * 3);
					j = 0;
					failed = false;
					while (j < len && !failed) {
						if (j < i || j > i + 2) {
							v4.fromArray(mesh.verts, path[j] * 3);
							failed = reverse ? isPointInsideXZ(v3, v2, v1, v4) : isPointInsideXZ(v1, v2, v3, v4);
						}
						j++;
					}
					if (!failed) {
						max = Math.abs(c);
						found = i;
					}		
				}
			}		
			i++;
		}
		if (found !== undefined) {
			mesh.indices.push(path[(found + 0) % len] ,path[(found + 1) % len], path[(found + 2) % len]);
			path.splice((found + 1) % len, 1)
			creating = path.length > 3;
		}
	}
	if (path.length === 3) { mesh.indices.push(path[0], path[1], path[2]) }
	
	return mesh;
}
function meshPathInset(mesh, path, inset, up = 0, reverse = false) {  // Modified Ear clip triangulation. Not optimised. Clips ear with largest internal angle each pass
	var i, j, max, failed, found, creating = true;
	const v1 = new Vec3(), v2 = new Vec3(), v3 = new Vec3(), newVerts = [];
	i = 0;
	const len = path.length;
	while (i < len) {
		v2.fromArray(mesh.verts, path[i] * 3);
		v1.fromArray(mesh.verts, path[(i + len - 1) % len] * 3).sub(v2).rotate270XZ();
		v3.fromArray(mesh.verts, path[(i + 1) % len] * 3).sub(v2).rotate90XZ();
		v1.y = 0;
		v3.y = 0;
		v1.normalize().add(v3.normalize()).normalize().scale(inset);
		v1.y = up;
		v2.add(v1);
		newVerts.push(v2.x, v2.y, v2.z);
		i++;
	}
	return newVerts;
}
function rayPolyIntercept(origin, ray,  p1, p2, p3, res = new Vec3()) {
    p1.sub(p2);
    p3.sub(p2);
    const a = p1.dot(ray.cross(p3, v1));
    if (a > -Math.EPSILON && a < Math.EPSILON) { return }    // This ray is parallel
    const f = 1.0 / a;
    origin.sub(p2, v2);
    const u = f * v2.dot(v1);
    if (u < 0.0 || u > 1.0) { return  }
    v2.cross(p1, v3);
    const v = f * ray.dot(v3);
    if (v < 0.0 || u + v > 1.0) { return }
    const t = f * p3.dot(v3);
    if (t > Math.EPSILON) { return origin.addScaled(t, ray, res) }
}
function weldVerts(mesh, ...indices) {
	mesh.eachSelectionField("verts", selection => selection.updating());
	mesh.eachSelectionField("normals", selection => selection.updating());	
	const hasNormals = mesh.normals !== undefined;
	const w = v1;
	const v = v2.zero();
	const n = v3.zero();
	for(const ind of indices) {
		v.add(v1.init(mesh.verts[ind * 3], mesh.verts[ind * 3 + 1], mesh.verts[ind * 3 + 2]));
		hasNormals && n.add(v1.init(mesh.normals[ind * 3], mesh.normals[ind * 3 + 1], mesh.normals[ind * 3 + 2]));
	}
	v.scale(1 / indices.length);
	n.normalize();
	mesh.verts[indices[0] * 3] = v.x;
	mesh.verts[indices[0] * 3 + 1] = v.y;
	mesh.verts[indices[0] * 3 + 2] = v.z;
	if (hasNormals) {
		mesh.normals[indices[0] * 3] = n.x;
		mesh.normals[indices[0] * 3 + 1] = n.y;
		mesh.normals[indices[0] * 3 + 2] = n.z;
	}
	const ia = [], na = [], va = [];
	var i = 0, added = false, newInd;
	while (i < mesh.verts.length) {
		const ind = i / 3;
		if (indices.includes(ind)) {
			if(!added) {
				newInd = ia[ind] = va.length / 3;
				mesh.eachSelectionField("verts", selection => selection.replace(i / 3, newInd));
				va.push(mesh.verts[i],mesh.verts[i + 1],mesh.verts[i + 2]);
				if(hasNormals) {
					mesh.eachSelectionField("normals", selection => selection.replace(i / 3, newInd));
					na.push(mesh.normals[i],mesh.normals[i + 1],mesh.normals[i + 2]);
				}
				added = true;
			} else {
				mesh.eachSelectionField("verts", selection => selection.replace(ia[ind], newInd));
				mesh.eachSelectionField("normals", selection => selection.replace(ia[ind], newInd));
				ia[ind] = newInd;
			}
		} else {
			ia[ind] = va.length / 3;
			mesh.eachSelectionField("verts", selection => selection.replace(i / 3, va.length / 3));
			va.push(mesh.verts[i],mesh.verts[i + 1],mesh.verts[i + 2]);
			if(hasNormals) {
				mesh.eachSelectionField("normals", selection => selection.replace(i / 3, na.length / 3));
				na.push(mesh.normals[i],mesh.normals[i + 1],mesh.normals[i + 2]);
			}
		}
		i+= 3;
	}
	i = 0;
	while (i < mesh.indices.length) { mesh.indices[i] = ia[mesh.indices[i++]] }
	mesh.verts = va;
	hasNormals && (mesh.normals = na);
	mesh.eachSelectionField("verts", selection => selection.updating(false));
	mesh.eachSelectionField("normals", selection => selection.updating(false));		
	return mesh;
}
const geometry = {
	smoothMesh(mesh) {
		const va = mesh.verts, pa = mesh.indices;
		const fn = [], f = [];
         
		
		var i = 0;
		while (i < pa.length / 3) {
			faceNorm(mesh, i++);
			fn.push(v1.clone());
			f.push(i);
		}		
		var linking = true;
		var idx = 0;
		i = 0;
		
		while(linking) {
			const a = pa[i],b = pa[i + 1],c = pa[i + 2];
			const n1 = fn[i / 3];

		}	
	},		
	join(mesh, dist, dotNorm) {
		const hasNormals = mesh.normals !== undefined;
		var i = 0, j;
		var locating = true;
		while (locating) {
			locating = false;
			i = 0;
			while (i < mesh.verts.length) {
				const ind1 = i / 3;
				const found = [ind1];
				v1.fromArray(mesh.verts, i);
				hasNormals && v2.fromArray(mesh.normals, i);
				j = i + 3;
				while(j < mesh.verts.length) {
					const ind2 = j / 3;
					v3.fromArray(mesh.verts, j);
					const d = v1.distanceFrom(v3);
					if (d <= dist) {
						if (hasNormals) {
							v4.fromArray(mesh.normals, j);
							const d = v2.dot(v4);
							if(d > 1 - dotNorm) {
								found.push(ind2);
							}
						} else { found.push(ind2) }
					}
					j += 3;
				}
				if (found.length > 1) {
					locating = true;
					weldVerts(mesh, ...found);
					break;
				}
				i += 3;
			}
		}
		return mesh;
		
	},
	clone(mesh) {
		const m = new Mesh([...mesh.indices]);
		for (const f of mesh.fields) {
			m.addField(f.name, f.size, [...mesh[f.name]]);
		}
		return m;
	},
	seperateFaces(mesh) {
		mesh.eachSelectionField("verts", selection => selection.updating());
		mesh.eachSelectionField("normals", selection => selection.updating());
		const newVerts = new Array(mesh.indices.length * 3), newNormals = new Array(mesh.indices.length * 3);
		const copyVert = (ind, i) => {
			newVerts[i] = mesh.verts[mesh.indices[ind] * 3];
			newVerts[i + 1] = mesh.verts[mesh.indices[ind] * 3 + 1];
			newVerts[i + 2] = mesh.verts[mesh.indices[ind] * 3 + 2];
			mesh.eachSelectionField("verts", selection => selection.replace(mesh.indices[ind], i));

			if (mesh.normals) {
				newNormals[i] = mesh.normals[mesh.indices[ind] * 3];
				newNormals[i + 1] = mesh.normals[mesh.indices[ind] * 3 + 1];
				newNormals[i + 2] = mesh.normals[mesh.indices[ind] * 3 + 2];
				mesh.eachSelectionField("normals", selection => selection.replace(mesh.indices[ind], i));
			}
			mesh.indices[ind] = i / 3;
		}
		var i, idx = 0;
		i = 0;
		while (i < mesh.indices.length) {
			copyVert(i, idx);
			idx += 3;
			copyVert(i + 1, idx);
			idx += 3;
			copyVert(i + 2, idx);
			idx += 3;
			i += 3;
		}
		mesh.verts = newVerts;
		mesh.normals !== undefined && (mesh.normals = newNormals);
		mesh.eachSelectionField("verts", selection => selection.updating());
		mesh.eachSelectionField("normals", selection => selection.updating());
		return mesh;
	},		
	addNormals(mesh) {
		var i = 0;
		mesh.addField("normals", 3);
		const newVertArray = new Array(mesh.verts.length);
		const add = (v, idx) => {
			if (newVertArray[idx]) { newVertArray[idx].add(v) }
			else { newVertArray[idx] = v.clone() }
		}
		while (i < mesh.indices.length / 3) {
			faceNorm(mesh, i);
			const [a, b, c] = faceInds(mesh, i);
			add(v1, a);
			add(v1, b);
			add(v1, c);
			i++;
		}
		mesh.normals = new Array(newVertArray.length);
		i = 0;
		for (const n of newVertArray) {
			if (n) { n.normalize().setArray(mesh.normals, i) }
			i += 3;
		}
		return mesh;
				
	},
	vetMesh(mesh) {
		if (! (mesh instanceof Mesh)) { throw new Error("Mesh error. Mesh is not an instance of Mesh") }
		mesh.vet();
		return mesh;
	},
	setDebugVec(idx, vec) {
		debugVecs[idx] = vec;
	},
	slicePath(mesh, path) {
		
	},
	slice(mesh, plane) {
		var i = 0, c, s1, s2, s3;
		const updatePoly = (i, i1,i2,i3) => {	
			mesh.indices[i * 3] = i1;
			mesh.indices[i * 3 + 1] = i2;
			mesh.indices[i * 3 + 2] = i3;		
			faceIds.add(i);
		}			
		const addPoly = (i1, i2, i3) => {
			faceIds.add(mesh.indices.length / 3);
			mesh.indices.push(i1, i2, i3);
		}
		const faceIds = new Set();
		const newIndsF = [];
		const newIndsB = [];
		const [p2, p1, p3] = plane.asArray();
		const norm = plane.normal.clone();
		const up = p1.clone().normalize().scale(-0.7);
		const pa1 = p2.add(p1, p2.clone());
		const pa3 = p2.add(p3, p2.clone());
		const vv1 = new Vec3(),vv2 = new Vec3(),vv3 = new Vec3();
		const vm1 = new Vec3(),vm2 = new Vec3(),vm3 = new Vec3();
		const lineSliced = [vv1,vv2,vv3];
		
		const len = mesh.indices.length / 3, icps = [], icms = [];
		while (i < len) {
			const [i1,i2,i3] = faceInds(mesh, i);
			faceVerts(mesh, i1, i2, i3, v1, v2, v3);
			
			s1 = Math.sign(norm.dot(v1.sub(p2, v5)));
			s2 = Math.sign(norm.dot(v2.sub(p2, v5)));
			s3 = Math.sign(norm.dot(v3.sub(p2, v5)));

			icms.length = icps.length = 0;
			v1.rayPoly4Intercept(v2.sub(v1, v4), pa1, p2, pa3, v5) !== undefined && (icps.push(0), vv1.copyOf(v5));
			v2.rayPoly4Intercept(v3.sub(v2, v4), pa1, p2, pa3, v5) !== undefined && (icps.push(1), vv2.copyOf(v5));
			v3.rayPoly4Intercept(v1.sub(v3, v4), pa1, p2, pa3, v5) !== undefined && (icps.push(2), vv3.copyOf(v5));
			c = icps.length;
			if (c < 2) {
				p2.rayPolyIntercept(p1, v1, v2, v3, v6) !== undefined && icms.push(vm1.copyOf(v6));
				pa3.rayPolyIntercept(p1, v1, v2, v3, v6) !== undefined && icms.push(vm2.copyOf(v6));
			}
			if(c === 2) {  // sliced across two edges
				let idx1 = copyVert(mesh,i1,lineSliced[icps[0]].addScaled(1,up,v4));
				let idx1B = copyVert(mesh,i1,lineSliced[icps[0]].addScaled(-1,up,v4));
				let idx2 = copyVert(mesh,i1,lineSliced[icps[1]].addScaled(1,up,v4));
				let idx2B = copyVert(mesh,i1,lineSliced[icps[1]].addScaled(-1,up,v4));
				if(icps[0] === 0 && icps[1] === 1) {
					if (s2 < 0) {
						[idx1B, idx1] = [idx1, idx1B];
						[idx2B, idx2] = [idx2, idx2B];
					}
					updatePoly(i, i1, idx1, i3);
					addPoly(i3, idx1, idx2);								
					addPoly(i2, idx2B, idx1B);
				} else if(icps[0] === 1 && icps[1] === 2) {
					if (s3 < 0) {
						[idx1B, idx1] = [idx1, idx1B];
						[idx2B, idx2] = [idx2, idx2B];
					}
					updatePoly(i, i1, i2, idx2);
					addPoly(i2, idx1, idx2);
					addPoly(i3, idx2B, idx1B);	
				} else if(icps[0] === 0 && icps[1] === 2) {
					if (s1 < 0) {
						[idx1B, idx1] = [idx1, idx1B];
						[idx2B, idx2] = [idx2, idx2B];
					}
					updatePoly(i, i2, i3, idx1);
					addPoly(i3, idx2, idx1);	
					addPoly(i1, idx1B, idx2B);	
				}
				newIndsF.push(idx1, idx2);
				newIndsB.push(idx1B, idx2B);
			} else if(c === 1 && icms.length === 1) { // sliced from inside across one edge
				let idx2 = copyVert(mesh,i1,lineSliced[icps[0]].addScaled(1,up,v4));
				let idx2B = copyVert(mesh,i1,lineSliced[icps[0]].addScaled(-1,up,v4));				
				const idx1 = copyVert(mesh,i1,icms[0]);				
				if (icps[0] === 0) {
					if (s1 > 0) { [idx2B, idx2] = [idx2, idx2B] }						
					updatePoly(i, i1, idx2, idx1);
					addPoly(i2, idx1, idx2B);
					addPoly(i2, i3, idx1);						
					addPoly(i3, i1, idx1);							
				}else if (icps[0] === 1) {
					if (s2 > 0) { [idx2B, idx2] = [idx2, idx2B] }
					updatePoly(i, i2, idx2, idx1);
					addPoly(i3, idx1, idx2B);
					addPoly(i3, i1, idx1);						
					addPoly(i1, i2, idx1);						
				}else if (icps[0] === 2) {					
					if (s3 > 0) { [idx2B, idx2] = [idx2, idx2B] }
					updatePoly(i, i3, idx2, idx1);
					addPoly(i1, idx1, idx2B);
					addPoly(i1, i2, idx1);						
					addPoly(i2, i3, idx1);						
				}
				newIndsF.push(idx1, idx2);
				newIndsB.push(idx1, idx2B);				
			} else if(c === 0 && icms.length === 2) { // sliced inside, no edges crossed
				let idx1 = copyVert(mesh,i1,icms[0]);
				let idx2 = copyVert(mesh,i1,icms[1]);
				const d1 = 1- icms[0].sub(v1, v5).normalize().dot(icms[1].sub(v1, v4).normalize());
				const d2 = 1- icms[0].sub(v2, v5).normalize().dot(icms[1].sub(v2, v4).normalize());
				const d3 = 1- icms[0].sub(v3, v5).normalize().dot(icms[1].sub(v3, v4).normalize());
				
				if(d1 < d2 && d1 < d3) {
					const d1 = icms[0].distanceFrom(v1);
					const d2 = icms[1].distanceFrom(v1);
					if (d2 < d1) { [idx2, idx1] = [idx1, idx2]  }
					updatePoly(i, i1, i2, idx1);						
					addPoly(i2, idx2, idx1);
					addPoly(i2, i3, idx2);
					addPoly(i3, idx1, idx2);
					addPoly(i3, i1, idx1);
				} else if (d2 < d1 & d2 < d3) {
					console.log("V2 small");
					const d1 = icms[0].distanceFrom(v2);
					const d2 = icms[1].distanceFrom(v2);
					if (d2 < d1) { [idx2, idx1] = [idx1, idx2] }
					updatePoly(i, i1, i2, idx1);	
					addPoly(i2, i3, idx1);
					addPoly(i3, idx2, idx1);
					addPoly(i3, i1, idx2);
					addPoly(i1, idx1, idx2);				
				} else {
					const d1 = icms[0].distanceFrom(v3);
					const d2 = icms[1].distanceFrom(v3);
					if (d2 < d1) { [idx2, idx1] = [idx1, idx2] }
					updatePoly(i, i1, i2, idx2);	
					addPoly(i2, idx1, idx2);
					addPoly(i2, i3, idx1);
					addPoly(i3, i1, idx1);
					addPoly(i1, idx2, idx1);											
				}
				newIndsF.push(idx1, idx2);
				newIndsB.push(idx1, idx2B);	
			} else {
				if(c || icms.length)  {
					console.log("Bad slice edge: " + c + " inner: " + icms.length)
				}
			}
			i++;
		}

		const newFaces = mesh.newFaces || (mesh.newFaces = []);
		for(const fid of faceIds.values()) {
			newFaces.push(...faceInds(mesh, fid));
			
		}

		return mesh;
	},
	selectFacesByVert(mesh, selName, vertInds, inside = true) {
		if(inside) {
			const faces = vertsToFacesInside(mesh, vertInds)
			const sel = mesh.createSelection(selName, "faces");
			sel.select(...faces);
		}
		return mesh;
			
	},
	land: {
		extrudeByEdge(mesh, vertInds, pullVec) {
			return this.extrude(mesh, vertsToFacesInside(mesh, vertInds), pullVec);			
		},
		extrudeBySelection(mesh, selName, pullVec) {
			if (mesh.selections[selName] && mesh.selections[selName].field === "faces") {
				this.extrude(mesh, [...mesh.selections[selName].ids.values()], pullVec);	
			}
			return mesh;
		},
		extrude(mesh, faces, pullVec) {
		
			var i = 0, j;
			const vertIdx = new Map();
			while (i < faces.length) {
				const inds = faceInds(mesh, faces[i]);
				j = 0;
				while (j < 3) {
					if (vertIdx.has(inds[j])){
						const v = vertIdx.get(inds[j]);
						v.faces.push(faces[i] * 3 + j);
					} else {
						vertIdx.set(inds[j], {ind: inds[j], faces: [faces[i] * 3 + j]});						
					}
					j ++;
				}
				i++;
			}
			const copyIdx = [...vertIdx.values()];
			const nV = mesh.verts.length / 3;
			i = 0;
			while(i < copyIdx.length) {				
				const newIdx = copyVert(mesh, copyIdx[i].ind, pointVert(mesh, copyIdx[i].ind, v1).add(pullVec));
				for (const fi of copyIdx[i].faces) {
					const f = fi / 3 | 0;
					const fv = fi % 3;
					mesh.indices[f * 3 + fv] = newIdx;
				}
				i++;
			}				
			return mesh;
		},
		
		
	},
	translate(mesh, x, y, z) {
		var i = 0;
		while (i < mesh.verts.length) {
			mesh.verts[i++] += x;
			mesh.verts[i++] += y;
			mesh.verts[i++] += z;			
		}
		return mesh;
	},
	scale(mesh, sx, sy = sx, sz = sy) {
		var i = 0;
		while (i < mesh.verts.length) {
			mesh.verts[i++] *= sx;
			mesh.verts[i++] *= sy;
			mesh.verts[i++] *= sz;			
		}
		return mesh;
	},
	rotate90(mesh, axis1 = "x", axis2 = "z") {
		var i = 0;
		axis1 = AXIS_IDX[axis1]
		axis2 = AXIS_IDX[axis2]
		while (i < mesh.verts.length) {
			const temp = mesh.verts[i + axis1];
			mesh.verts[i + axis1] = -mesh.verts[i + axis2];
			mesh.verts[i + axis2] = temp;
			if (mesh.normals) {
				const temp = mesh.normals[i + axis1];
				mesh.normals[i + axis1] = -mesh.normals[i + axis2]
				mesh.normals[i + axis2] = temp;
			}
			i += 3;
		}
		return mesh;
	},
	project(mesh, a, b, c) {
		var i = 0;
		while (i < mesh.verts.length) {
			v1.fromArray(mesh.verts, i).project(a, b, c).setArray(mesh.verts, i);
			i += 3;
		}
		return mesh;
	},
	path2DTo3D(path, axis1 = "x", axis2 = "z") {
		var i = 0;
		axis1 = AXIS_IDX[axis1];
		axis2 = AXIS_IDX[axis2];
		const path3d = [],  len = path.length / 2;;
		while(i < len) {
			path3d.push(0,0,0);
			path3d[i * 3 + axis1] = path[i * 2];
			path3d[i * 3 + axis2] = path[i * 2 + 1];
			i ++;
		}
		return path3d
	},
	reversePath3D(path) {
		const len = path.length / 3;
		const pathRev = [];
		var i = 0, j = len - 1;
		while (i < len) {
			const jj = j * 3;
			pathRev.push(path[jj], path[jj + 1], path[jj + 2]);
			i ++;
			j --;
		}
		return pathRev;
	},
	centerPath3D(path) {
		var x = 0, y = 0, z = 0, i = 0;
		const len = path.length;
		while( i < len) {
			x += path[i++];
			y += path[i++];
			z += path[i++];
		}
		x /= path.length / 3;
		y /= path.length / 3;
		z /= path.length / 3;
		i = 0;
		while( i < len) {
			path[i++] -= x;
			path[i++] -= y;
			path[i++] -= z;
		}
		return path;
	},
	mapTexture(mesh, origin, vX, vY) {
		var i = 0;
		mesh.addField("maps", 2);
		while(i < mesh.verts.length) {
			v1.fromArray(mesh.verts, i);
			v1.projectUnit(vX, origin, vY);
			mesh.maps.push(v1.x, v1.y);
			i += 3;
		}
		return mesh;
	},
	mapFaceTexture(mesh, scale = 1, selName) {
		const setMap = (ind, coord, mean) => {
			ind *= 3;
			if (maps[ind] === undefined) {
				maps[ind++] = coord.x;
				maps[ind++] = coord.y;
				maps[ind++] = 1;
			} else if(mean){
				maps[ind++] += coord.x;
				maps[ind++] += coord.y;
				maps[ind++] += 1;
			}
		}	
		var sel;
		if (selName) {
			if(mesh.selections[selName] && mesh.selections[selName].field === "faces") {
				sel = mesh.selections[selName];
			}
		}
		const va = new Vec3(), vm = new Vec3(), scV = new Vec3(scale, scale, 1);
		var i = 0;
		const maps = new Array(mesh.verts.length);
		while(i < mesh.indices.length) {
			let apply = true;
			if(selName) {
				apply = false;
				if(sel) {
					apply = sel.ids.has(i / 3);
				}
			}
			if(apply) {
				const i1  = mesh.indices[i++];
				const i2  = mesh.indices[i++];
				const i3  = mesh.indices[i++];
				vm.fromArray(maps, i1 * 3);
				vm.z === undefined ? vm.zero() : (vm.x /= vm.z, vm.y /= vm.z, vm.z = 1);
				v1.fromArray(mesh.verts, i1 * 3);
				v2.fromArray(mesh.verts, i2 * 3);
				v3.fromArray(mesh.verts, i3 * 3);
				
				v4.fromArray(mesh.normals, i1 * 3);
				v5.fromArray(mesh.normals, i2 * 3);
				v6.fromArray(mesh.normals, i3 * 3);
				
				va.copyOf(v4).add(v5).add(v6).normalize();
				
				v3.sub(v2).normalize();
				v2.sub(v1).normalize().cross(va, va).normalize();
				v2.add(v1);
				va.add(v1);
				
				v4.fromArray(mesh.verts, i1 * 3);
				v5.fromArray(mesh.verts, i2 * 3);
				v6.fromArray(mesh.verts, i3 * 3);
				
				v4.projectUnit(v2, v1, va).multiply(scV).add(vm); 
				v5.projectUnit(v2, v1, va).multiply(scV).add(vm); 
				v6.projectUnit(v2, v1, va).multiply(scV).add(vm); 
				setMap(i1, v4);
				setMap(i2, v5, true);
				setMap(i3, v6, true);
			} else {
				i += 3;
			}
		}
		mesh.addField("maps", 2);
		i = 0;
		while(i < maps.length) {
			const d = maps[i + 2] !== undefined ? maps[i+2] : 1;
			mesh.maps.push(
				maps[i] / d,
				maps[i + 1] / d
			)
			i += 3;
		}
		return mesh;
	},
	retileTexture(mesh, tiles, selName) {
		const setQuadVert = (ind, tile, x , y) => {
			mesh.maps[ind * 3] = x;
			mesh.maps[ind * 3 + 1] = y;
			mesh.maps[ind * 3 + 2] = tile;
			
		}
		var sel;
		if (selName) {
			if(mesh.selections[selName] && mesh.selections[selName].field === "faces") {
				sel = mesh.selections[selName];
			}
		}
		var i = 0;
		const u = (1 / 11) * 2;
		const v = (1 / 4) * 2;
		var tile = 0;
		while (i < mesh.indices.length) {
			let apply1 = true, apply2 = true;
			if(selName) {
				apply2 = apply1 = false;
				if(sel) {
					apply1 = sel.ids.has(i / 3);
					apply2 = sel.ids.has(i / 3 + 1);
				}
			}
			const i1 = mesh.indices[i];
			const i2 = mesh.indices[i + 1];
			const i3 = mesh.indices[i + 2];
			
			const i4 = mesh.indices[i + 3];
			const i5 = mesh.indices[i + 4];
			const i6 = mesh.indices[i + 5];
			const t = tiles[tile % tiles.length];
			if(apply1) {
				setQuadVert(i1, t, 0, 0)
				setQuadVert(i2, t, u, 0)
				setQuadVert(i3, t, u, v)
			}
			if(apply2) {
				setQuadVert(i4, t, 0, 0)
				setQuadVert(i5, t, u, v)
				setQuadVert(i6, t, 0, v)
			}
			if (apply1 || apply2) { tile ++ }
			i += 6;
		}
			
		return mesh;
	},		
	mapTileTexture(mesh, tiles, selName) {
		const setQuadVert = (ind, tile, x , y) => {
			mesh.maps[ind * 3] = x;
			mesh.maps[ind * 3 + 1] = y;
			mesh.maps[ind * 3 + 2] = tile;
			
		}
		geometry.mapFaceTexture(mesh,1, selName);
		const oldMap = mesh.maps;
		mesh.addField("maps", 3);
		var i = 0;
		while (i < mesh.verts.length / 3) {
			mesh.maps[i * 3] = oldMap[i * 2] / 11;
			mesh.maps[i * 3 + 1] = oldMap[i * 2 + 1] / 4;
			mesh.maps[i * 3 + 2] = 0;
		//	mesh.maps[i * 3 + 2] = i / 2 | 0;
			i += 1;
		}
		i = 0;
		const u = (1 / 11) * 2;
		const v = (1 / 4) * 2;
		var tile = 0;
		while (i < mesh.indices.length) {
			const i1 = mesh.indices[i];
			const i2 = mesh.indices[i + 1];
			const i3 = mesh.indices[i + 2];
			
			const i4 = mesh.indices[i + 3];
			const i5 = mesh.indices[i + 4];
			const i6 = mesh.indices[i + 5];
			const t = tiles[tile % tiles.length];
			setQuadVert(i1, t, 0, 0)
			setQuadVert(i2, t, u, 0)
			setQuadVert(i3, t, u, v)
			setQuadVert(i4, t, 0, 0)
			setQuadVert(i5, t, u, v)
			setQuadVert(i6, t, 0, v)
			tile ++;
			i += 6;
		}
			
		return mesh;
	},
};


const geometryPrimitives = {
	createSmoothGrouped(type, normalRange, ...args) {
		return geometry.join(geometry.addNormals(geometry.seperateFaces(geometryPrimitives[type](...args))));
	},
	box(size) {
		const s = size / 2;
		return  new Mesh([1,0,3, 1,3,2, 0,4,7, 0,7,3, 4,5,6, 4,6,7, 5,1,2, 5,2,6, 5,4,0, 5,0,1, 2,3,7, 2,7,6])
			.addField("verts", 3, [-s, -s,  s,   s, -s,  s,   s,  s,  s,  -s,  s,  s,  -s, -s, -s,   s, -s, -s,   s,  s, -s,  -s,  s, -s]);			
	},
	rect(w, h, d) {
		w /= 2;
		h /= 2;
		d /= 2;
		return  new Mesh([1,0,3, 1,3,2, 0,4,7, 0,7,3, 4,5,6, 4,6,7, 5,1,2, 5,2,6, 5,4,0, 5,0,1, 2,3,7, 2,7,6])
			.addField("verts", 3, [-w, -h,  d,   w, -h,  d,   w,  h,  d,  -w,  h,  d,  -w, -h, -d,   w, -h, -d,   w,  h, -d,  -w,  h, -d]);	


	},
	meshPath(...path) {
		var i = 0;
		const mesh = new Mesh().addField("verts", 3);	
		mesh.verts.push(...path);			
		const ia = [];
		while (i < path.length) { ia.push(i / 3); i += 3 }
		meshPath(mesh, ia);
		return mesh;
	},
	meshPathExtrude(path, h, capTop = true, capBot = true) {
		var i = 0;
		const mesh = new Mesh().addField("verts", 3);	
		mesh.verts.push(...path);
	
		while (i < path.length) {
			mesh.verts.push(
				path[i++],
				path[i++] + h,
				path[i++] 
			);
		}
		i = 0;
		const ita = [], iba = [], vCount = path.length / 3;
		while (i < vCount) { 
			const indb = i;
			const indt = indb + vCount;
			const indb1 = (indb + 1) % vCount;
			const indt1 = indb1 + vCount;
			ita.push(indt); 
			iba.push(indb); 
			mesh.indices.push(indt, indt1, indb1);
			mesh.indices.push(indt, indb1, indb);
			
			i ++;
		}
		capTop && meshPath(mesh, ita.reverse());
		capBot && meshPath(mesh, iba, true);
		return mesh;
	},
	meshPathExtrudePath(path, ePath, capTop = true, capBot = true) {  // ePath extrude path is 2D points x is inset, y is height
		var i = 0;
		const mesh = new Mesh().addField("verts", 3);	
		mesh.verts.push(...path);
		const inds = [];
		while (i < path.length) { inds.push(i / 3); i += 3 }
		capBot && meshPath(mesh, [...inds], true);
		
		const pLen = inds.length;
		var j = 0, idxA = 0, idxB = 0;
		while (j < ePath.length) {
			mesh.verts.push(...meshPathInset(mesh, inds, -ePath[j++], ePath[j++], false));
			i = 0;
			idxA = idxB;
			idxB += pLen;
			while (i < pLen) {
				mesh.indices.push(idxA + i, idxB + i, idxB + (i + 1) % pLen);
				mesh.indices.push(idxA + i, idxB + (i + 1) % pLen, idxA + (i + 1) % pLen);
				inds[i] += pLen;
				i ++;
			}
		}
		capTop && meshPath(mesh, inds.reverse());
		return mesh;
	},	
	cone(steps, h, r) {
		h /= 2;
		const aStep = Math.PI * 2 / steps;		
		const mesh = new Mesh().addField("verts", 3);		
        var i = 0, idx = 0, idxI = 0, vIdx = 2;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = h;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
        
		while (i < steps) {
			const ang = i * aStep;
			const x = Math.cos(ang) * r;
			const z = Math.sin(ang) * r;			
			mesh.verts[idx++] = x;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z;
			
			const n = i + 1 !== steps;
			mesh.indices[idxI++] = 0;
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = n ? vIdx + 1 : 2;
			
			mesh.indices[idxI++] = n ? vIdx + 1 : 2;
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = 1;					
			vIdx += 1;

			i++;
		}
		return mesh;
	},
	rod(steps, h, rTop, rBot = rTop, closeTop = true, closeBottom = true) {
        const vTopBot = (closeTop ? 1 : 0) + (closeBottom ? 1 : 0);
		const aStep = Math.PI * 2 / steps;		
		const mesh = new Mesh().addField("verts", 3);			
        var i = 0, idx = 0, idxI = 0,  vIdxT = vTopBot, vIdxB = vTopBot + 1;
		if (closeBottom) {
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = 0;
		} 
		if (closeTop) {
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = h;
			mesh.verts[idx++] = 0;
		}
        
		while (i < steps) {
			const ang = i * aStep;
			const xt = Math.cos(ang) * rTop;
			const zt = Math.sin(ang) * rTop;			
			const xb = Math.cos(ang) * rBot;
			const zb = Math.sin(ang) * rBot;
			mesh.verts[idx++] = xt;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = zt;

			mesh.verts[idx++] = xb;
			mesh.verts[idx++] = h;
			mesh.verts[idx++] = zb;
			
			const n = i + 1 !== steps;
			if (closeBottom) {
				mesh.indices[idxI++] = 0;
				mesh.indices[idxI++] = n ? vIdxT + 2 : vTopBot;
				mesh.indices[idxI++] = vIdxT;
			}
			
			mesh.indices[idxI++] = vIdxT;
			mesh.indices[idxI++] = n ? vIdxB + 2 : vTopBot + 1;				
			mesh.indices[idxI++] = vIdxB;					

			mesh.indices[idxI++] = vIdxT;
			mesh.indices[idxI++] = n ? vIdxT + 2 : vTopBot;
			mesh.indices[idxI++] = n ? vIdxB + 2 : vTopBot + 1;				

			if (closeTop) {
				mesh.indices[idxI++] = 1;
				mesh.indices[idxI++] = vIdxB;
				mesh.indices[idxI++] = n ? vIdxB + 2 : vTopBot + 1;
			}

			vIdxT += 2;
			vIdxB += 2;

			i++;
		}
		return mesh;
	},
	plane(xSteps, zSteps, w = 1, d = w, heightFunc) {
		xSteps = Math.max(xSteps, 2);
		zSteps = Math.max(zSteps, 2);
		const cx = w / 2, cz = d / 2;
		w = w / xSteps;
		d = d / zSteps;
		const mesh = new Mesh().addField("verts", 3);		
		var x = 0, z = 0;
		var idxI = 0,  idx = 0;
		while (z < zSteps) {
			x = 0;
			while (x < xSteps) {
				mesh.verts[idx++] = x * w - cx;
				mesh.verts[idx++] = heightFunc ? heightFunc(x,z) : 0;
				mesh.verts[idx++] = z * d - cz;
				x ++;
			}
			z ++;
		}
		z = 0;
		while (z < zSteps - 1) {
			x = 0;
			const zz = z * xSteps, zz1 = zz + xSteps;
			
			while (x < xSteps - 1) {
				mesh.indices[idxI++] = zz + x;
				mesh.indices[idxI++] = zz + x + 1;
				mesh.indices[idxI++] = zz1 + x + 1;

				mesh.indices[idxI++] = zz + x;
				mesh.indices[idxI++] = zz1 + x + 1;
				mesh.indices[idxI++] = zz1 + x;

				x ++;
			}
			z ++;
		}

		return mesh;
	},	
	disk(steps, r) {
		const aStep = Math.PI * 2 / steps;		
		const mesh = new Mesh().addField("verts", 3);			
        var i = 0, idx = 0, idxI = 0,  vIdx = 1;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
        
		while (i < steps) {
			const ang = i * aStep;
			const x = Math.cos(ang) * r;
			const z = Math.sin(ang) * r;			
			mesh.verts[idx++] = x;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z;
			const n = i + 1 !== steps;
			mesh.indices[idxI++] = 0;
			mesh.indices[idxI++] = n ? vIdx + 1 : 1;
			mesh.indices[idxI++] = vIdx;
			vIdx += 1;
			i++;
		}
		return mesh;
	},
	circle(steps, r1, r2 = r1 / 2) {
		const aStep = Math.PI * 2 / steps;		
		const mesh = new Mesh().addField("verts", 3);	
        var i = 0, idx = 0, idxI = 0,  vIdx = 0;

        
		while (i < steps) {
			const ang = i * aStep;
			const x = Math.cos(ang);
			const z = Math.sin(ang);			
			mesh.verts[idx++] = x * r1;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z * r1;
			
			mesh.verts[idx++] = x * r2;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z * r2;
			
			const n = i + 1 !== steps;
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = vIdx + 1;
			mesh.indices[idxI++] = n ? vIdx + 3 : 1;
			
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = n ? vIdx + 3 : 1;
			mesh.indices[idxI++] = n ? vIdx + 2 : 0;
			

			vIdx += 2;
			i++;
		}
		return mesh;
	},		
	tube(steps,h, r1, r2 = r1 / 2, r3 = r1, r4 = r2) {

		const aStep = Math.PI * 2 / steps;		
		const mesh = new Mesh().addField("verts", 3);		
        var i = 0, idx = 0, idxI = 0,  vIdx = 0;

        
		while (i < steps) {
			const ang = i * aStep;
			const x = Math.cos(ang);
			const z = Math.sin(ang);			
			mesh.verts[idx++] = x * r2;
			mesh.verts[idx++] = h;
			mesh.verts[idx++] = z * r2;
			
			mesh.verts[idx++] = x * r1;
			mesh.verts[idx++] = h;
			mesh.verts[idx++] = z * r1;

			mesh.verts[idx++] = x * r4;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z * r4;
			
			mesh.verts[idx++] = x * r3;
			mesh.verts[idx++] = 0;
			mesh.verts[idx++] = z * r3;

			const n = i + 1 !== steps;
			
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = vIdx + 1;
			mesh.indices[idxI++] = n ? vIdx + 5 : 1;
			
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = n ? vIdx + 5 : 1;
			mesh.indices[idxI++] = n ? vIdx + 4 : 0;
			
			mesh.indices[idxI++] = vIdx + 1;
			mesh.indices[idxI++] = vIdx + 3;
			mesh.indices[idxI++] = n ? vIdx + 7 : 3;
			
			mesh.indices[idxI++] = vIdx + 1;
			mesh.indices[idxI++] = n ? vIdx + 7 : 3;
			mesh.indices[idxI++] = n ? vIdx + 5 : 1;		

			mesh.indices[idxI++] = vIdx + 3;
			mesh.indices[idxI++] = vIdx + 2;
			mesh.indices[idxI++] = n ? vIdx + 7 : 3;
			
			mesh.indices[idxI++] = n ? vIdx + 7 : 3;
			mesh.indices[idxI++] = vIdx + 2;
			mesh.indices[idxI++] = n ? vIdx + 6 : 2;
		

			mesh.indices[idxI++] = n ? vIdx + 6 : 2;
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = n ? vIdx + 4 : 0;
			
			mesh.indices[idxI++] = n ? vIdx + 6 : 2;
			mesh.indices[idxI++] = vIdx + 2;			
			mesh.indices[idxI++] = vIdx;
			
			vIdx += 4;
			i++;
		}
		return mesh;
	},		
	sphere(steps, r) {

		const s = (steps / 2 | 0) - 1;
		const aStep = Math.PI * 2 / steps;		
		const hStep = Math.PI / s;		
		const mesh = new Mesh().addField("verts", 3);			
        var i = 0, j, idx = 0,  idxI = 0, vIdx = 2;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = r;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = 0;
		mesh.verts[idx++] = -r;
		mesh.verts[idx++] = 0;
        
		while (i < steps) {
			const ang = i * aStep;
			j = 0;
			while (j < s) {
				const ang2 = j * hStep + hStep;
				const rr = Math.sin(ang2) * r;
				mesh.verts[idx++] = Math.cos(ang) * rr;
				mesh.verts[idx++] = Math.cos(ang2) * r;
				mesh.verts[idx++] = Math.sin(ang) * rr;	
                j ++;				
			}
			
			const n = i + 1 !== steps;
			mesh.indices[idxI++] = 0;
			mesh.indices[idxI++] = vIdx;
			mesh.indices[idxI++] = n ? vIdx + s : 2;
			j = 0;
			while (j < s - 1) {
				mesh.indices[idxI++] = vIdx;
				mesh.indices[idxI++] = vIdx + 1;
				mesh.indices[idxI++] = n ? vIdx + 1 + s : 3 + j;
				
				mesh.indices[idxI++] = vIdx;
				mesh.indices[idxI++] = n ? vIdx + 1 + s :  3 + j;
				mesh.indices[idxI++] = n ? vIdx + s :  2 + j;
				
				vIdx ++;
				j ++
			}
			vIdx ++;
			mesh.indices[idxI++] = vIdx  - 2;
			mesh.indices[idxI++] = 1;
			mesh.indices[idxI++] = n ? vIdx - 2  + s : 0 + s;
			i++;
		}
		return mesh;
	}		
}
export {geometryPrimitives, geometry};

