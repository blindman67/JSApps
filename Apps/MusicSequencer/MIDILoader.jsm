    // creates a block aware by byte and string stream to simplify decoding.
function Stream(data) {
	var pos = 0;
	const dat = new Uint8Array(data);
	const len = dat.length;
	var chunkEnd;
	Object.assign(this, {
		string(count) { // returns a string from current pos
			var s = "";
			while (count-- > 0) { s += String.fromCharCode(dat[pos++]) }
			return s;
		},
		bytes(count) {
			const b = [];
			while (count-- > 0) { b.push(dat[pos++]) }
			return b;
		},
		text() { return this.string(this.value()) },
		data() { return this.bytes(this.value()) }, 
		chunkHead() { return this.string(4) },
		long() { return (dat[pos++] << 24) + (dat[pos++] << 16) + (dat[pos++] << 8) + dat[pos++] },
		word() { return (dat[pos++] << 8) + dat[pos++] },
		byte() { return dat[pos++] },
		value() {   // variable length value
			var val = dat[pos++], c;
			if (val & 0x80) {
				val &= 0x7F;
				do {
					c = dat[pos++];
					val = (val << 7) + (c & 0x7F);
				} while (c & 0x80);
			}
			return val;				
		},

		skipChunk() {
			const size = this.long();
			pos += size;
		},
		bit(value, bit) { return (value & (1 << bit)) !== 0 },
		bits(value, hBit, lBit) {
			var bP = hBit, i = hBit - lBit;
			var res = 0;
			while (bP >= lBit) {
				res += this.bit(value, bP) ? 1 << i  : 0;
				bP--;
				i--;
			}
			return res;
		},
		seek(dist) { pos += dist },
		markChunk() {
			const size = this.long();
			chunkEnd = pos + size;
		},
		eoc() { return pos >= chunkEnd },		
		eof() { return pos >= dat.length },
	});
}

const progChanges = [
	"BankSelect",
	"Modulationwheel",
	"Breathcontrol",
	"Undefined",
	"Footcontroller",
	"Portamentotime",
	"DataEntry",
	"ChannelVolumeformerlyMainVolume",
	"Balance",
	"Undefined",
	"Pan",
	"ExpressionController",
	"Effectcontrol1",
	"Effectcontrol2",
	"Undefined",
	"Undefined",
	"GeneralPurposeController1",
	"GeneralPurposeController2",
	"GeneralPurposeController3",
	"GeneralPurposeController4",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"BankSelect",
	"Modulationwheel",
	"Breathcontrol",
	"Undefined",
	"Footcontroller",
	"Portamentotime",
	"Dataentry",
	"ChannelVolumeformerlyMainVolume",
	"Balance",
	"Undefined",
	"Pan",
	"ExpressionController",
	"Effectcontrol1",
	"Effectcontrol2",
	"Undefined",
	"Undefined",
	"GeneralPurposeController1",
	"GeneralPurposeController2",
	"GeneralPurposeController3",
	"GeneralPurposeController4",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Damperpedalon_offSustain",
	"Portamentoon_off",
	"Sustenutoon_off",
	"Softpedalon_off",
	"LegatoFootswitch",
	"Hold2",
	"SoundController1SoundVariation",
	"SoundController2Timbre",
	"SoundController3ReleaseTime",
	"SoundController4AttackTime",
	"SoundController5Brightness",
	"SoundController6",
	"SoundController7",
	"SoundController8",
	"SoundController9",
	"SoundController10",
	"GeneralPurposeController5",
	"GeneralPurposeController6",
	"GeneralPurposeController7",
	"GeneralPurposeController8",
	"PortamentoControl0",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Effects1Depth",
	"Effects2Depth",
	"Effects3Depth",
	"Effects4Depth",
	"Effects",
	"DataentryPlus1",
	"DataentryMinus1",
	"NonRegisteredParameterNumber",
	"NonRegisteredParameterNumber",
	"RegisteredParameterNumber",
	"RegisteredParameterNumber",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"Undefined",
	"AllSoundOff",
	"ResetAllControllers",
	"Localcontrol",
	"Allnotesoff",
	"Omnimodeoff",
	"Omnimodeon",
	"Polymodeon_off",
	"Polymodeon ",
];
const drums = [
	"Acoustic Bass Drum",
	"Bass Drum 1",
	"Side Stick",
	"Acoustic Snare",
	"Hand Clap",
	"Electric Snare",
	"Low Floor Tom",
	"Closed Hi Hat",
	"High Floor Tom",
	"Pedal Hi-Hat",
	"Low Tom",
	"Open Hi-Hat",
	"Low-Mid Tom",
	"Hi Mid Tom",
	"Crash Cymbal 1",
	"High Tom",
	"Ride Cymbal 1",
	"Chinese Cymbal",
	"Ride Bell",
	"Tambourine",
	"Splash Cymbal",
	"Cowbell",
	"Crash Cymbal 2",
	"Vibraslap",
	"Ride Cymbal 2",
	"Hi Bongo",
	"Low Bongo",
	"Mute Hi Conga",
	"Open Hi Conga",
	"Low Conga",
	"High Timbale",
	"Low Timbale",
	"High Agogo",
	"Low Agogo",
	"Cabasa",
	"Maracas",
	"Short Whistle",
	"Long Whistle",
	"Short Guiro",
	"Long Guiro",
	"Claves",
	"Hi Wood Block",
	"Low Wood Block",
	"Mute Cuica",
	"Open Cuica",
	"Mute Triangle",
	"Open Triangle",
];
drums.start = 0x35;







 	 	 

function MIDILoader(filename) {
	const constants = {
		ticks: 1,
		SMPTE: 2,
		format: {
			singleTrack: 0,
			simTracks: 1,
			tracks: 2,
		},
		unknown:         -1,
		exclusive:      	0b1111, 
		noteOff: 	 	0b1000,
		noteOn: 		 	0b1001,
		keyPressure:   	0b1010,
		controlChange: 	0b1011,
		progChange:    	0b1100,
		pressure: 		0b1101,
		pitchWheel: 		0b1110,
		u1: 			0b11110001,  // undefined
		u2: 			0b11110100,  // undefined
		u3: 			0b11110101,  // undefined
		u4: 			0b11111001,  // undefined
		u5: 			0b11111101,  // undefined
		activeSensing: 	0b11111110,
		signature:        0x58,
		substain:		 progChanges.indexOf("Damperpedalon_offSustain"),
		
		
	}
	var loading = false;
	var failed = false;
	var loaded = false;
	var onError, onLoad;
	var s;
	var midi;

	const C = constants;


	const meta = {
		unknown(type) { return {type, data: s.data()} },
		[0x01]() { return {text: s.text()} }, // text
		[0x02]() { return {copyright: s.text()} }, 
		[0x03]() { return {trackName: s.text()} }, 
		[0x04]() { return {instrumentName: s.text()} }, 
		[0x05]() { return {lyric: s.text()} }, 
		[0x06]() { return {mark:  s.text()} }, 
		[0x07]() { return {cue:   s.text()} }, 
		[0x08]() { return {text8: s.text()} }, 
		[0x09]() { return {text9: s.text()} }, 
		[0x0A]() { return {textA: s.text()} }, 
		[0x0B]() { return {textB: s.text()} }, 
		[0x0C]() { return {textC: s.text()} }, 
		[0x0D]() { return {textD: s.text()} }, 
		[0x0E]() { return {textE: s.text()} }, 
		[0x0F]() { return {textF: s.text()} }, 
		[C.signature]() { 
			s.byte();
			return {
				type: C.signature,
				beats: s.byte(),
				bpb: 2 ** s.byte(),
				ticksPerBeat: s.byte(),
				ticksPer32: s.byte(),
			} 
		}, 
	};

	const cEvent = {
		unknown() { return {type: C.unknown} },
		[0b10000000](channel) { return {/*info: "noteOff", 		*/	type: C.noteOff, 	   		channel, key: s.byte(), val: s.byte()} },
		[0b10010000](channel) { return {/*info: "noteOn", 		*/	type: C.noteOn, 	   		channel, key: s.byte(), val: s.byte()} },
		[0b10100000](channel) { return {/*info: "keyPressure", 	*/	type: C.keyPressure,  	channel, key: s.byte(), val: s.byte()} },
		[0b10110000](channel, id = s.byte()) { return {info:  progChanges[id],	type: C.controlChange,	channel, id, val: s.byte()} },
		[0b11110000](channel) { return {/*info: "exclusive", 	*/	type: C.exclusive,		channel, data: s.data()} },
		[0b11000000](channel) { return {/*info: "progChange", 	*/	type: C.progChange,   	channel, val: s.byte()} },
		[0b11000000](channel) { return {/*info: "pressure", 	    */	type: C.pressure,     	channel, val: s.byte()} },
		[0b11100000](channel) { return {/*info: "pitchWheel", 	*/	type: C.pitchWheel,   	channel, val: s.byte()} },
	};

	function Track() {
		var prevStatus;
		var notePos;
		var substain = false;
		const API = {
			events: [],
			next() {				
				const time = s.value();
				const event = {time};
				var status = s.byte();
                if (status >= 128) { prevStatus = status }
				else { status = prevStatus; s.seek(-1) }										
				if (status=== 255) { // meta
					const type = s.byte();
					Object.assign(event, meta[type]?.() ?? meta.unknown(type));
					
				} else {
					const ce = status & 0xF0;
					Object.assign(event, cEvent[ce]?.(status & 0xF) ?? cEvent.unknown());
				}
				API.events.push(event);
				
			},
			hasNotes() { return API.events.some(e => e.type === C.noteOn) },
			toAbsoluteTime() {
				var time = 0;
				for (const e of API.events) { e.time = (time += e.time) }
			},
			start() {
				substain = false;
				notePos = 0;
			},
			timeNoteOff(pos, note, startTime) {
				const substainState = substain;
				var i = pos, holding = substain, down = true;
				while (i < API.events.length) {
					const e = API.events[i];
					if (e.type === C.controlChange && e.id === C.substain) { 
						substain = e.val >= 64 
						if (substain) {
							holding = true;
						} else {
							if (!down) {
								substain = substainState;
								return e.time;
							}
							holding = false;
						}
								
						
					} else if (e.key === note && (e.type === C.noteOff || e.type === C.noteOn)) {
						down = false;
						if (!holding || (e.type === C.noteOn && e.val > 0)) {
							substain = substainState;
							return e.time;
						}
					}
					i++;
				}
				
				substain = substainState;
				return API.events[API.events.length - 1].time;
			},
			nextNote() {
				var i = notePos;
				while (i < API.events.length) {
					const e = API.events[i++];
					if (e.type === C.controlChange && e.id === C.substain) { substain = e.val >= 64 }
					else if (e.type === C.noteOn) {
						notePos = i;
						const off = API.timeNoteOff(i, e.key, e.time);
						return {note: e.key, vel: e.val, time: e.time, offTime: off};
					}
				}
			},
			nextOfType(type) {
				var i = notePos;
				while (i < API.events.length) {
					const e = API.events[i++];
					if (e.type === type) {
						notePos = i;
						return {...e};
					}
				}
			},
						
		};
		return API;
	}
	
	
	const Chunks = {
		MThd() {
			s.long();
			midi.format = s.word();
			midi.numTracks = s.word();			
			midi.tracks = [];
			const division = s.word();
			if (s.bit(division, 15)) {
				midi.timeFormat = constants.SMPTE;
				midi.SMPTEForm = s.bits(division, 14, 8);
				midi.tickPerFrame = s.bits(division, 7, 0);
			} else {
				midi.timeFormat = constants.ticks;
				midi.ticksPerQuarterNote = s.bits(division, 14, 0);
			}			
		},
		MTrk() {
			s.markChunk();
			const t = Track();
			midi.tracks.push(t);
			while (!s.eoc()) {
				t.next();
			}
			t.toAbsoluteTime();
			t.start();
			
		},
	}
	function parse() {
		var i;
		midi = {};		
		while (!s.eof()) {
			const chunk = s.chunkHead();
			if (Chunks[chunk]) {
				Chunks[chunk]();
			} else { s.skipChunk() }			
		}
		if (midi.format === C.format.singleTrack) {
			const channels = new Set([0]);
			for (const e of midi.tracks[0].events) {
				if (e.type === C.noteOn) { channels.add(e.channel) }
			}
			const tc = [...channels.values()].sort((a, b) => a - b);
			const tr1 = midi.tracks[0].events;
			midi.tracks = [];
			for (const c of tc) {
				i = 0;
				const t = Track();
				midi.tracks.push(t);
				while (i < tr1.length) {
					const e = tr1[i];
					if ((c === 0 && (e.channel === undefined || e.channel === 0)) || (e.channel === c && c > 0)) {
						t.events.push(e);
						tr1.splice(i--, 1);
					}
					i++;
				}
			}
				
			
		}
		return midi;
	}
	
    function dataLoaded(data) { 
		loading = false;
		loaded = true;
        s = new Stream(data);  
        midi = parse();
		onLoad(true);
    }
    function load(filename) { 
        var ajax = new XMLHttpRequest();
        loading = true;
        ajax.responseType = "arraybuffer";
        ajax.onload = function (e) {
            if (e.target.status === 404) {               
                console.error("File not found");
				failed = true;
				loading = false;
				onError("File not found");
				
            } else if (e.target.status >= 200 && e.target.status < 300 ) { dataLoaded(ajax.response) }
            else {
                console.error("Loading error : " + e.target.status)
				failed = true;
				loading = false;
				onError("Loading error : " + e.target.status);
             }
        };
        ajax.onerror = function (e) {
			failed = true;
			loading = false;
            console.error("File error " + e.message);
			onError("Loading error : " + e.target.status);
        };
		loading = true;
        ajax.open('GET', filename, true);
        ajax.send();
    }
	
	var currentTrack;
	const API = {
		types: C,
		load(filename) { 
			return new Promise((ok, fail) => {
				onLoad = ok;
				onError = fail;
				load(filename);
			});
		},
		get midi() { return midi },
		get trackCount() { return midi.tracks.length },
		getTrack(num) { return currentTrack = midi.tracks[num] },
		resetTracks() {
			for (const t of midi.tracks) { t.start() }
		},
		findEvent(type) {
			for (const t of midi.tracks) {
				t.start();
				const found = t.nextOfType(type)
				if (found) { return found }
			}
					
		},
			
		
		
	}
	return API;
}

export {MIDILoader};
