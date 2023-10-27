"use strict"; 
/* References 
    https://matroska.org/technical/specs/index.html   
	https://www.webmproject.org/docs/container/
*/
const webm = (() => {
	var EBML, encoder;
	const TRACK_NUMBER = 1;
    const MAX_CLUSTER_DURATION = 30;  // Seconds. Must not be greater than 32 seconds
	const CLUSTER = 0x1f43b675, CLUSTER_TIME = 0xe7;
	const DISCARDABLE = 128, MUST_SHOW = 0;
	const SIMPLE = 0xa3;   // block header
	const DATA = (id, data) => ({
		EBML_Id: EBML_Int[Math.log2(id) / 8 | 0](id) , 
		data: typeof data === "number" ? EBML_Int[Math.log2(data) / 8 | 0](data) : data
	});	
	function Double(num) { this.value = new Float64Array([num]) }
	const duration = time => EBML[1].data[0].data[3].data.value[0] += time;
	const strToBuf = str => new Uint8Array([...([...str].map(c => c.charCodeAt(0)))]);
	const webpChunk = (buf, i = 16) => buf.slice(i, i + 4 + ((buf[i+3]<<24) | (buf[i+2]<<16) | (buf[i+1]<<8) | buf[i]));  
		const dataToU8 = data => {
		var len = 0;
		for (const arr of data) { len += arr.length }
		const u8 = new Uint8Array(len);
		len = 0;
		for (const dat of data) { 
			u8.set(dat, len);
			len += dat.length; 
		}
		return u8;
	}
	const EBML_Int = [
	    int => new Uint8Array([int]),
	    int => new Uint8Array([int >> 8, int]),
	    int => new Uint8Array([int >> 16, int >> 8, int]),
	    int => new Uint8Array([int >> 24, int >> 16, int >> 8, int]),
	];
	const EBML_Size = [
		size => new Uint8Array([size | 0x80]),
		size => new Uint8Array([(size >> 8) | 0x40, size]),
		size => new Uint8Array([(size >> 16) | 0x20, size >> 8, size]),
		size => new Uint8Array([(size >> 24) | 0x10, size >> 16, size >> 8, size])
	];	
    function EBML_header(width, height, appName = "PainterV3.js"){
		return [
			DATA(0x1a45dfa3, [   // video
				DATA(0x4286, 1), // Version},
				DATA(0x42f7, 1), // Read version
				DATA(0x42f2, 4), // Max EMBL Id size
				DATA(0x42f3, 8), // Max EMBL data size field. Should be 4??? as that is the limit of this encoder
				DATA(0x4282, strToBuf("webm")), // Document type
				DATA(0x4287, 2), // Document version}
				DATA(0x4285, 2), // Document read version
			]),
			DATA(0x18538067, [ 		// Segment 
				DATA(0x1549a966, [ 	// Info
					DATA(0x2ad7b1, 1e6), 			      // Time scale in nanoseconds
					DATA(0x4d80, strToBuf(appName)), 	  // Muxing app name
					DATA(0x5741, strToBuf(appName)), 	  // App name
					DATA(0x4489, new Double(0)) // total video duration in Time scale
				]),
				DATA(0x1654ae6b, [ // Tracks
					DATA(0xae, [   // Track
						DATA(0xd7, TRACK_NUMBER),   		// Track number
						DATA(0x63c5, TRACK_NUMBER), 		// Track UID
						DATA(0x9c, 0),   					// Lacing 0 OFF
						DATA(0x22b59c, strToBuf("und")), 	// Language undefined
						DATA(0x86,     strToBuf("V_VP8")), 	// Codec Id
						DATA(0x258688, strToBuf("VP8")), 	// Codec name
						DATA(0x83, 1),  			    	// Track type
						DATA(0xe0, [DATA(0xb0, width), DATA(0xba, height)]),
					])
				])
			])
		 ];
    }
	function EBMLToArray(inData, vData = []) {
		var element, len;
		for (element of inData) {
			let data = element.data;
			if (data instanceof Double) { data = new Uint8Array(data.value.buffer) }
			else if (!(data instanceof Uint8Array) && typeof data === "object") { data = dataToU8(EBMLToArray(data)) }
			vData.push(element.EBML_Id);
			vData.push(EBML_Size[Math.log2(data.length) / 7 | 0](data.length));
			vData.push(data);
			delete element.data;  // to reduce memory overhead
			delete element.EBML_ID;
		}
		return vData;
	}
    async function addFrame (blob) {
		const data = webpChunk(new Uint8Array(await blob.arrayBuffer()));
		var addBlock = true;
        if (EBML.time === -1 || EBML.time > MAX_CLUSTER_DURATION * 1000) { 
			EBML[1].data.push(DATA(CLUSTER, [DATA(CLUSTER_TIME, Math.round(EBML.duration))])); // add cluster
			EBML.time = 0;
			EBML.currentBlock = undefined;
		}
		if (EBML.skipDups && EBML.currentBlock && EBML.currentBlock.data.length === data.length) { 
			let i = 4, step = 1;
			const cb = EBML.currentBlock.data;
			while(i < data.length && cb[i] === data[i]) { i += step < 128 ? step++ : 128 }
			if (i >= data.length) { addBlock = false }
		}
		if (addBlock) {
			data[0] = 0x80 + TRACK_NUMBER; data[3] = DISCARDABLE;  // or MUST_SHOW
			data[1] = Math.round(EBML.time) >> 8; 	
			data[2] = Math.round(EBML.time) & 0xff;			
			EBML[1].data[EBML[1].data.length - 1].data.push(EBML.currentBlock = DATA(SIMPLE, data));  // simple block
			EBML.size += data.length;
		}
		if (EBML.onready) { EBML.onready(EBML.duration, EBML.size) }
	}  
	function Encoder(canvas, appName, onready, frameRate = 60, quality = 0.8){ 
		this.frameCount = 0;
		this.frameTime = 1000 / (this.frameRate = frameRate);
		this.quality = quality;
        EBML = EBML_header(canvas.width, canvas.height, appName);
		EBML.duration = duration(0);
		EBML.onready = onready;
		EBML.time = -1;  // -1 to force new cluster
		EBML.size = 0; // approx size in bytes
		encoder = this;
	}
	Encoder.prototype = {
		get size() { return EBML ? EBML.size : 0 },
		set ignoreDuplicates(state) { EBML.skipDups = state },
		add(canvas, frameStep = 1) {  
			if (EBML) {
				if (!this.frameCount) { 
					canvas.toBlob(addFrame, 'image/webp', this.quality);
					this.frameCount ++;
				} else {
					frameStep = frameStep < 1 ? 1 : frameStep;
					EBML.time += this.frameTime * frameStep;
					EBML.duration = duration(this.frameTime * frameStep);
					this.frameCount += frameStep;
					canvas.toBlob(addFrame, 'image/webp', this.quality);
				}
			}
		},
		toBlob(holdFrameFor = 1) {			
			duration(this.frameTime * (holdFrameFor < 1 ? 1 : holdFrameFor));
			this.toBlob = this.add = undefined;
			const videoBlob = new Blob(EBMLToArray(EBML), {type: "video/webm"});
			EBML = undefined;			
			return videoBlob; 
		}
	};
	return { Encoder };
})();
//export {webm};

