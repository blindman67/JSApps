import {} from "./utils/MathExtensions.js";
import {} from "./Vec3.js";
export {MeshBuilder};
function MeshBuilder() {
	
    const indices = [];
    const verts = [];
	const buffers = {};
	const bufferList = [];
	// general purpose vectors
	const wP1 = new Vec3();
	const wP2 = new Vec3();
	const wP3 = new Vec3();
	const wP4 = new Vec3();
	// 
	const cBuf = [[0], [0,0], [0,0,0], [0,0,0,0]];
	
	function updateBufferList() {
	    bufferList.length = 0;
	    bufferList.push(...Object.values(buffers));
	}
	function Buffer(name, size, {onadd, oncopy, onaddface} = {}, glSettings = {}) {
		this.name = name;
		this.size = size;
		this.onadd = onadd;
		this.oncopy = oncopy;
		this.onaddface = onaddface;
		this.glSettings = glSettings;
		this.buf = [];
		buffers[name] = this;
		updateBufferList();
	}
	Buffer.prototype = {
		clear() { this.buf.length = 0 },
		delete() {
			this.clear();
			this.buf = undefined;
			delete buffers[name];
			updateBufferList();
		},
	}
	function polysAt(idx) {
		var i = 0;
		const polys = [];
		while (i < indices.length) {
			if (indices[i] === idx) { polys.push(i) }
			i++;
		}
		return polys;
	}
	function splitVert(idx) {
		var c = 0, i = verts.length / 3;
		const polys = polysAt(idx), p = wp1, inds = [idx];
		p.fromArray(verts, idx * 3);
		for(const i of polys) {
			if (c) {
				copyVert(idx, p);
				inds.push(indices[i] = i++);
			}
			c++;
		}
		return inds;
	}
	function faceWithIdx(idx, fromIdx = 0) {
		while(fromIdx < indices.length) {
			if(indices[fromIdx] === idx) {
				const poly = [idx];
				poly.push(((idx / 3 | 0) * 3) + (idx + 1) % 3);
				poly.push(((idx / 3 | 0) * 3) + (idx + 2) % 3);
				return {idx: fromIdx, indices: poly}
			}
		}
	}
	function faceNormal(idx) {
		const polys = polysAt(idx), p = wP1, p1 = wP2, p2 = wP3, p3 = w4;
		p.zero()
		p1.fromArray(verts, idx * 3);
		for(const idx of polys) {
			const ix = (idx /  3 | 0) * 3;
			p2.fromArray(verts, (ix + ((idx % 3 + 1) % 3)) * 3).normalFrom(p1); 
			p3.fromArray(verts, (ix + ((idx % 3 + 2) % 3)) * 3).normalFrom(p1); 
			p.add(p2.cross(p3).normalize());
		}
		p.normalize();
		normals[idx * 3] = p.x;
		normals[idx * 3 + 1] = p.y;
		normals[idx * 3 + 2] = p.z;
	}
	function changeInd(toIdx, idx) {
	    var i = 0;
	    while (i < indices.length) {
	        if(indices[i] === idx) { indices[i] = toIdx }
	        i++
	    }
	}
	function changeInds(toIdx, ...vIdxs) {
	    var i;
		while (vIdxs.length) {
			const idx = vIdxs.pop();
			i = 0;
			while (i < indices.length) {
				if(indices[i] === idx) { indices[i] = toIdx }
				i++
			}
	    }
	}	
	function createPoly(offset, ...vIdxs) {
		arrayAddition(offset, vIdxs);
		if	(vIdxs.length === 3) { addFace(vIdxs[0], vIdxs[1], vIdxs[2]) }
		else if	(vIdxs.length === 4) { addFace(vIdxs[0], vIdxs[1], vIdxs[2]); addFace(vIdxs[0], vIdxs[2], vIdxs[3]) }
		else if (vIdxs.length > 4) {
			const len = vIdxs.length;
			var cw = 0, ccw = len;
			addFace(vIdxs[cw++], vIdxs[cw++], vIdxs[cw]);
			while (cw < ccw) {
				addFace(vIdxs[(ccw--) % len], vIdxs[cw], vIdxs[ccw % len]);
				if (cw < ccw) {
					addFace(vIdxs[cw++], vIdxs[cw], vIdxs[ccw % len]);
				}
			}
		}
	}
	function createPolyFan(offset, ...vIdxs) {
		var i  = 1;
		while (i < vIdxs.length - 1) {
			addFace(offset + vIdxs[0], offset + vIdxs[i++], offset + vIdxs[i]);
		}
	}
	function weld(...vIdxs) {
		var i = 0;
		const p = wP2.fromArray(verts, vIdxs[i++] * 3);
		while (i < vIdxs.length) {
			empty.push(vIdxs[i]);
			const idx = vIdxs[i++] * 3;
			p.x += verts[idx];
			p.y += verts[idx + 1];
			p.z += verts[idx + 2];
		}
		p.scale(1 / vIdxs.length).setArray(verts, vIdxs[0] * 3);
		changeInds(vIdxs.shift(), ...vIdxs);
	}
	function arrayAddition(v, arr, i = arr.length) {
		while (i-- > 0) { arr[i] += v }
		return arr;
	}
	function addVert(v) {
	    verts.push(v.x, v.y, v.z);
	    for(const buf of bufferList) {
	        const b = buf.buf;
	        if (buf.onadd) {
				const cpb = buf.onadd(buf.size, v, verts.length / 3 - 1);
				cpb.length = buf.size;
				b.push(...cpb);				
	        } else { b.push(...cBuf[buf.size-1]) }
	    }	    
	}
	function copyVert(idx, v) {
	    verts.push(v.x, v.y, v.z);
	    for(const buf of bufferList) {
			const i = idx * buf.size;
			const cb = cBuf[buf.size - 1];
			const b = buf.buf;
			if (buf.size === 1)      { cb[0] = b[i] }
	        else if (buf.size === 2) { cb[0] = b[i]; cb[1] = b[i+1] }
	        else if (buf.size === 3) { cb[0] = b[i]; cb[1] = b[i+1]; cb[2] = b[i+2] }
	        else if (buf.size === 4) { cb[0] = b[i]; cb[1] = b[i+1]; cb[2] = b[i+2]; cb[3] = b[i+3] }
			
	        if (buf.oncopy) {
				const cpb = buf.oncopy(buf.size, v, verts.length / 3 - 1, idx, cb);
				cpb.length = buf.size;
				b.push(...cpb);
	        } else { b.push(...cb) }
	    }	    
	}
	function addFace(idx1, idx2, idx3) {
		indices.push(idx1, idx2, idx3);
		for(const buf of bufferList) {
			if(buf.onaddface){
			    const v1 = new Vec3().fromArray(verts, idx1 * 3);
			    const v2 = new Vec3().fromArray(verts, idx2 * 3);
			    const v3 = new Vec3().fromArray(verts, idx3 * 3);
				const res = buf.onaddface(buf.size, v1, v2, v3); // return an array
				var j = 3, inI = 0;
				const idxs = [idx1 * buf.size, idx2 * buf.size, idx3 * buf.size];
				while (j--) {
				    let i = buf.size;
				    let idx = idxs[2 - j];
				    while(i--) {
				        buf.buf[idx++] = res[inI++]
				    }
				}
			}
		}
	}

	const API = {
	    reset() {
	        verts.length = 0;
	        indices.length = 0;
	        for(const buf of bufferList) { buf.clear }
	    },
	    addPolyFan(...vIdxs) { createPolyFan(0, ...vIdxs) },
	    addVert(v) { addVert(v); return verts.length / 3 - 1 },
	    addFace(idx1, idx2, idx3) { addFace(idx1, idx2, idx3) },
		addRect(v, vUW, vUH, sW, sH, returnIdxs = true) {
			const p = wP1;
			var i = verts.length / 3;
			addVert(v.subScaled(sW / 2, vUW, p).subScaled(sH / 2, vUH));
			addVert(v.addScaled(sW / 2, vUW, p).subScaled(sH / 2, vUH));
			addVert(v.addScaled(sW / 2, vUW, p).addScaled(sH / 2, vUH));
			addVert(v.subScaled(sW / 2, vUW, p).addScaled(sH / 2, vUH));
			createPolyFan(i, 0, 1, 2, 3);
			return returnIdxs ? [i, i+1, i+2, i+3] : undefined;
		},
		addCube(v, vUW, vUH, vUD, sW, sH, sD, capBottom = true, returnIdxs = true) {
			const p = wP1;
			var i = verts.length / 3;
			sW /= 2; sH /= 2; sD /= 2;
			addVert(v.subScaled(sW, vUW, p).subScaled(sD,vUD).subScaled(sH,vUH));
			addVert(v.addScaled(sW, vUW, p).subScaled(sD,vUD).subScaled(sH,vUH));
			addVert(v.addScaled(sW, vUW, p).subScaled(sD,vUD).addScaled(sH,vUH));
			addVert(v.subScaled(sW, vUW, p).subScaled(sD,vUD).addScaled(sH,vUH));
			addVert(v.subScaled(sW, vUW, p).addScaled(sD,vUD).subScaled(sH,vUH));
			addVert(v.addScaled(sW, vUW, p).addScaled(sD,vUD).subScaled(sH,vUH));
			addVert(v.addScaled(sW, vUW, p).addScaled(sD,vUD).addScaled(sH,vUH));
			addVert(v.subScaled(sW, vUW, p).addScaled(sD,vUD).addScaled(sH,vUH));
			createPolyFan(i + 4, 0, 1, 2, 3);
			createPolyFan(i, 0, 1, 5, 4);
			createPolyFan(i, 1, 2, 6, 5);
			createPolyFan(i, 2, 3, 7, 6);
			createPolyFan(i, 3, 0, 4, 7);
			createPolyFan(i, 0, 1, 5, 4);
			capBottom && createPolyFan(i , 0, 3, 2, 1);
			indices.push(i, i + 1, i + 2, i, i + 2, i + 3);
			return returnIdxs ? {
					top: arrayAddition(i + 4, [0, 1, 2, 3]),
					front: arrayAddition(i, [0, 1, 5, 4]),
					right: arrayAddition(i, [1, 2, 6, 5]),
					back: arrayAddition(i, [2, 3, 7, 6]),
					left: arrayAddition(i, [3, 0, 4, 7]),
					bottom: arrayAddition(i, [0, 3, 2, 1]),				
				} :  undefined;
		},		
		move(alongV, amount, ...vIdxs) {
		    const p = wP1;
		    for(const vIdx of vIdxs) {
		        p.fromArray(verts, vIdx * 3).addScaled(amount,alongV).setArray(verts, vIdx * 3);
		    }
		    return vIdxs;
		},
		extrude(alongV, amount, ...vIdxs) {
		    const res = API.inset(0, ...vIdxs);
		    API.move(alongV, amount, ...res.inset);
		    return res;
		},
		inset(amount, ...vIdxs) {
			var j = 0, i = verts.length / 3;
			const p = wP1.zero(), p1 = wP2, len = vIdxs.length, newIndices = [];
			for(const vIdx of vIdxs) { p.add(p1.fromArray(verts, vIdx * 3)) }
			p.scale(1 / vIdxs.length);
			for(const vIdx of vIdxs) {
				changeInd(verts.length / 3, vIdx);
				newIndices.push(verts.length / 3);
				copyVert(vIdx, p1.fromArray(verts, vIdx * 3).scaleFrom(p, 1 - amount));
			}
			const res = {
			    inset: newIndices,
			    outer: [],
			};
			while (j < vIdxs.length) {
				const j1 = (j + 1) % len;
				addFace(vIdxs[j], i + j, i + j1);
				addFace(vIdxs[j], i + j1, vIdxs[j1]);
				res.outer.push([vIdxs[j], i + j, i + j1,  vIdxs[j1]]);
				j += 1;
			}	
			return res;
		},
		split(vIdxs = [...new Set(indices).valuse()]) {
		    const newIndices = [];
		    for(const idx of vIdxs) {
		        splitVert(idx);
		    }
		    
		    
		    
		},
		chanfa(amount, vIdx) {
			const vIdxs = splitVert(ind), p1 = wP1, p2 = wP2;
			for(const idx of vIdxs) {
				let poly = faceWithIdx(idx, 0);
				while(poly) {
					p1.fromArray(verts, poly.indices[0] * 3);
					p2.fromArray(verts, poly.indices[1] * 3);
					p1.addScaled(amount, p2.normalFrom(p1));
					
					verts[poly.indices[0] * 3] = p1.x;
					verts[poly.indices[0] * 3 + 1] = p1.y;
					verts[poly.indices[0] * 3 + 2] = p1.z;
					
					poly = faceWithIdx(idx, poly.idx + 1);
				}
			}
		},
		get vertsArray() { return [...verts] },
		createNormals() {
			var i = 0;
			const p = wP1, p1 = wP2, len = vIdxs.length, vLen = len / 3;
			normals.length = 0;
			while (i < vLen) { normals.push(0,0,0); i++ }
			const inds = new Set(indices);
			for(const ind of inds.values()) {
				faceNormal(ind);
			}
		},
		createBuffer(name, size, options, glSettings) {
			if(buffers[name]) { buffers[name].delete() }
			new Buffer(name, size, options);
		},
		getBuffer(name) { 
			const buf = buffers[name];
		    if (buf) {
    		    return  {
					...ARRAY_BUFFER_DEFAULT,
					...buf.glSettings,
    	            size: buffers[name].size,
    	            data: new Float32Array(buffers[name].buf),
    		    };		        
		    }
		},				
		get verts() { 
		    return  {
	            ...ARRAY_BUFFER_DEFAULT,
	            size: 3,
	            data: new Float32Array(verts),
		    };
		},
		get indices() { 
		    return  {
	            type: "ELEMENT_ARRAY_BUFFER",
	            use: "STATIC_DRAW",
	            dataType: indices.length < 256 ? "UNSIGNED_BYTE" : "UNSIGNED_SHORT",
	            data: indices.length < 256 ? new Uint8Array(indices) : new Uint16Array(indices),
		    }
		}
	};
	
	return API;
}