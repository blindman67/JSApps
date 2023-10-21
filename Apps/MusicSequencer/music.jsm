const setOf = (count, cb, i = 0, a = []) => {while (i < count) { a.push(cb(i++)) } return a}

const notesOld = [
    27.50,   29.14,   30.87,   32.70,   34.65,   36.71,   38.89,   41.20,   43.65,   46.25,   49.00,   51.91,
    55.00,   58.27,   61.74,   65.41,   69.30,   73.42,   77.78,   82.41,   87.31,   92.50,   98.00,   103.83,
    110.00,  116.54,  123.47,  130.81,  138.59,  146.83,  155.56,  164.81,  174.61,  185.00,  196.00,  207.65,
    220.00,  233.08,  246.94,  261.63,  277.18,  293.66,  311.13,  329.63,  349.23,  369.99,  392.00,  415.30,
    440.00,  466.16,  493.88,  523.25,  554.37,  587.33,  622.25,  659.25,  698.46,  739.99,  783.99,  830.61,  // A4
    880.00,  932.33,  987.77,  1046.50, 1108.73, 1174.66, 1244.51, 1318.51, 1396.91, 1479.98, 1567.98, 1661.22,
    1760.00, 1864.66, 1975.53, 2093.00, 2217.46, 2349.32, 2489.02, 2637.02, 2793.83, 2959.96, 3135.96, 3322.44,
    3520.00, 3729.31, 3951.07, 4186.01, 4434.92, 4698.63, 4978.03, 5274.04, 5587.65, 5919.91, 6271.93, 6644.88]; // from A0
const notes = {};
const nameConvert = {
    Ab: name => "Gs" + (Number(name[2]) - 1),
    A:  name => name,
    As: name => name,
    Bb: name => "As" + Number(name[2]),
    B:  name => name,
    C:  name => "C"  + (Number(name[1]) - 1),
    Cs: name => "Cs" + (Number(name[2]) - 1),
    Db: name => "Cs" + (Number(name[2]) - 1),
    D:  name => "D"  + (Number(name[1]) - 1),
    Ds: name => "Ds" + (Number(name[2]) - 1),
    Eb: name => "Ds" + (Number(name[2]) - 1),
    E:  name => "E"  + (Number(name[1]) - 1),
    F:  name => "F"  + (Number(name[1]) - 1),
    Fs: name => "Fs" + (Number(name[2]) - 1),
    Gb: name => "Fs" + (Number(name[2]) - 1),
    G:  name => "G"  + (Number(name[1]) - 1),
    Gs: name => "Gs" + (Number(name[2]) - 1),

    newName(oldName) {
        return nameConvert[oldName.length === 2 ? oldName[0] : oldName[0] + oldName[1]](oldName);
    }
}
const noteNames = "A,As,B,C,Cs,D,Ds,E,F,Fs,G,Gs".split(",");
const noteNamesB = "A,A\u266F,B,C,C\u266F,D,D\u266F,E,F,F\u266F,G,G\u266F".split(",");
notesOld.map((freq, idx)=> {
    const newName = noteNames[idx % 12] + (idx / 12 | 0);
    notes[newName] =  freq;
})
Object.entries(notes).forEach(([name, freq], i) => 
	notes[name] = {name, nameB: noteNamesB[i % 12], freq, idx: i, octave: i / 12 | 0, note: i % 12}
);
//const NOTE_NUMBERS = ["i","ii","iii","iv","v","vi","vii"];
const NOTE_NUMBERS = ["1","2","3","4","5","6","7","8", "9","10","11","12"];
const NOTE_NAME = new Map(Object.values(notes).map(note=>([note.name, note])));
const NOTE_FREQ = new Map(Object.values(notes).map(note=>([note.freq, note])));
const NOTE_IDX = Object.values(notes).map(note => note);
function createNoteArray(val) { return NOTE_IDX.map(()=>val) }
const quarters = ["","\u00BC","\u00BD","\u00BE"];
function noteDesc(note) {
    var desc = note.note.name + " " + (note.length >= 1 ? note.length.toFixed(0) : "") + quarters[(note.length % 1) * 4 | 0] +" ";
    desc += (note.bar + 1 | 0) + "/";
    desc += (note.beat + 1 | 0).toFixed(0);
    desc += quarters[(note.beat % 1) * 4 | 0] + " ";
    return desc;
}
const cords = {
	major:		[0, 4, 7],
	major6: 	[0, 4, 7, 9],
	major7: 	[0, 4, 7, 11],
	minor: 		[0, 3, 7],
	minor6: 	[0, 3, 7, 9],
	minor7: 	[0, 3, 7, 10],
	minor_major7:[0, 3, 7, 11],
	dominant7: 	[0, 4, 7, 10],
	augmented: 	[0, 4, 8],
	augmented7: [0, 4, 8, 10],
	diminished: [0, 3, 6],
	diminished7:[0, 3, 6, 9],
}
const chords = cords;
const chordsNamed = {
	maj:	[0, 4, 7],
	maj6: 	[0, 4, 7, 9],
	maj7: 	[0, 4, 7, 11],
	min: 	[0, 3, 7],
	min6: 	[0, 3, 7, 9],
	min7: 	[0, 3, 7, 10],
	minmaj7:[0, 3, 7, 11],
	dom7: 	[0, 4, 7, 10],
	aug: 	[0, 4, 8],
	aug7:   [0, 4, 8, 10],
	dim:    [0, 3, 6],
	dim7:   [0, 3, 6, 9],
}



const guitar = {
    strings: [ // open strings
        setOf(20, i => 31 + i),
        setOf(20, i => 36 + i),
        setOf(20, i => 41 + i),
        setOf(20, i => 46 + i),
        setOf(20, i => 50 + i),
        setOf(20, i => 55 + i),
    ],
    /*cords: { // -1 mutted string, 0 open string
        E:  [ 0, 2, 2, 1, 0, 0],
        A:  [-1, 0, 2, 2, 1, 0],
        Am: [-1, 0, 2, 2, 0, 0],
        G:  [ 3, 2, 0, 0, 0, 3],
        D:  [-1,-1, 0, 2, 3, 2],
    },*/
	chords: {
		major: {
			A: ".02220",
			B: ".24442",
			C: "332010",
			D: "..0232",
			E: "022100",
			F: "133211",
			G: "320003",
		},
		minor: {
			A: ".02210",
			B: ".24432",
			C: ".13321",
			D: "..0231",
			E: "022000",
			F: "133111",
			G: "355333",
		},
	},
    patterns: [  // ??? may remove
        [0,1,2,3,4,5,4,3,2,1,0],
        [0,1,2,3,4,5],
        [0,5,1,4,2,5,3,4,5,4,3,5,2,4,1,5,0],
        [0,4,1,5,2,4,3,5,4,5,3,4,2,5,1,4,0],

    ],
}
const NamedScales = {
    major: {
		scale: [0, 2, 4, 5, 7, 9, 11],
		names: "ABCDEFG",
	},	
    minor: {
		scale: [0, 2, 3, 5, 7, 8, 10],
		names: "ABCDEFG",
	},	
	mixolydian: {
		scale: [0, 2, 3, 5, 7, 8, 10],
		names: "ABCDEFG",
	
	},
    ionian:  {
        scale: [0, 2, 4, 5, 7, 9, 11],
        names: "ABCDEFG",
    },		
    aeolian: {
        scale: [0, 2, 3, 5, 7, 8, 10],
        names: "ABCDEFG",
    },
    harmonicMajor: {
        scale: [0, 1, 4, 5, 7, 8, 11],
        names: "ABCDEFG",
    },
    harmonicMinor: {
        scale: [0, 2, 3, 6, 7, 8, 11],
        names: "ABCDEFG",
    },
	superLocrian: {
		scale: [0, 1, 3, 4, 6, 8, 10], // H-W-H-W-W-W-W
		names: "ABCDEFG",
	},
    bluesMajor: {
        scale: [0, 2, 3, 4, 7, 9],
        names: "ABCDEF",
    },
    blues: {
        scale: [0, 3, 5, 6, 7, 10],
        names: "ABCDEF",
    },
	algerianLower: {
		scale: [0, 2, 3, 7, 8, 9],
		names: "ABCDEF",
	},
    wholeTone: {
        scale: [0, 2, 4, 6, 8, 10],
        names: "ABCDEF",
    },
    pentatonicMajor: {
        scale: [0, 2, 4, 7, 9],
        names: "ABCDE"
    },
    pentatonicMinor: {
        scale: [0, 3, 5, 7, 10],
        names: "ABCDE",
    },
    chromatic: {
        scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        names: "AaBCcDdEFfGg",
    },
	guitarMajor: {
		scale: [0, 2, 4, 5, 7, 9, 11],
		open: [31, 36, 41, 46, 50, 55, 65],
		names: "ABCDEFG",
	},
	guitarChromatic: {
		scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
		open: [31, 36, 41, 46, 50, 55, 65],
		
		names: "AaBCcDdEFfGg",
	},
};

const createKey = (name, scale) => {
	const scaleName = Object.keys(NamedScales).find(sName => NamedScales[sName] === scale);
    const notePos = scale.scale;
    const names = scale.names;
	const gType = scale.open !== undefined;
	const strings = scale.open;
    const noteCount = names.length;
    const keyNoteIdx = NOTE_NAME.get(name + "0").idx;
    const rootNote = NOTE_NAME.get(name + "0").idx;
	const keyChords = {};
	var i = 0;
	for (const ch of names) {
		const r = notePos[i];
		for (const c of Object.keys(chords)) {
			const chr = chords[c];
			if (chr.every(n => notePos.includes((n + r) % 12))) {
				keyChords[(ch + c)] = chr.map(n => n + r);
			}
		}
	}
	
    var note = 0, noteIdx = 0, octave = 4, oct = 0;
    const keyNotes = {};
	const keyNoteIdxs = [];
    while (noteIdx < NOTE_IDX.length) {
        noteIdx = keyNoteIdx +  oct * 12;
        if (noteIdx < NOTE_IDX.length) {
            keyNotes[name + oct] = NOTE_IDX[noteIdx];
			
			keyNoteIdxs.push(...notePos.map(n => n + noteIdx));
        }
        oct ++;
    }
    return {
		get keyName() { return name },
		get scaleName() { return scaleName },
		get keyOffset() { return keyNoteIdx },
        chordType:  "",
		chordAt(idx, type) {
            if (type !== undefined) {
                const nameIdx = notePos.indexOf((idx + (12 -  keyNoteIdx)) % 12);
                if (nameIdx > -1) {
                    const nName = names[nameIdx];
                    if (gType) {
                        const chr = guitar.chords[type][nName];
                        if (chr) {
                            var i = 0;
                            const notes = [];
                            for(const f of chr) {
                                if (f !== ".") {
                                    notes.push(strings[i] + Number(f));
                                }
                                i++;
                            }
                            notes.fixedPos = true;
                            this.chordType = type;
                            return notes;		
                        }

                    } else {
                        const chr = chords[type];
                        if (chr.every(n => keyNoteIdxs.includes(n + idx))) {
                            this.chordType = type;
                            return [...chr];
                        }			 
                    }
                }
            }
            this.chordType = undefined;
			//return [];
		},
		keyChords,
        noteCount,
		getNotes(available) {
			var i, fPos;
			const all = createNoteArray().map(() => 0);
			for (const [root, note] of Object.entries(keyNotes)) {				
				if (gType) {
					for (const offIdx of scale.scale) {
						const pos = note.idx + offIdx;
						if (pos >= strings[0] && pos <= strings[6]) {
							i = 0;
							fPos = -1;
							while (i < strings.length - 1) {
								if (pos >= strings[i] && pos < strings[i + 1]) {
									fPos = pos - strings[i];
									break;
								}
								i++;
							}
							if (fPos > -1) {							
								all[pos] = available[pos] ? 2 + fPos + (i << 4): 0;
							}
						}
					}
				} else {
					for (const offIdx of scale.scale) {
						all[note.idx + offIdx] = available[note.idx + offIdx] ? 1 : 0;
					}
				}
			}
			return all;
		},
        notes: keyNotes,
		notePos,
        set octave(val) { octave = val },
        get octave() { return octave},
        getNote(name, offset) {
            name = name.length === 1 ? name + octave : name;
            return keyNotes[name];
        },
		transpose(note, newScale) {
			for (const n of Object.values(this.notes)) {
				if (note.idx >= n.idx && note.idx < n.idx + 12) {
					const idx = notePos.indexOf(note.idx - n.idx);
					if (idx >- 1) {
						const oct = Object.values(newScale.notes)[n.octave];
						const newIdx = oct.idx + newScale.notePos[idx];
						return NOTE_IDX[newIdx];
					}
					
				}
				
			}
			return note;
			
		}
    }
}

export {NOTE_NAME, NOTE_FREQ, NOTE_IDX, NOTE_NUMBERS, createKey, NamedScales, chords, chordsNamed, guitar, nameConvert, createNoteArray, noteDesc, noteNames};