
import {acousticGrandPiano} from "./acousticGrandPiano.jsm";
import {acousticGuitarNylon} from "./acousticGuitarNylon.jsm";
import {violin} from "./violin.jsm";
import {panFlute} from "./panFlute.jsm";
import {tuba} from "./tuba.jsm";
import {altoSax} from "./altoSax.jsm";
import {xylophone} from "./xylophone.jsm";
import {orchestralHarp} from "./orchestralHarp.jsm";
import {timpani} from "./timpani.jsm";
import {kalimba} from "./kalimba.jsm";
import {tubularBells} from "./tubularBells.jsm";


const SoundFont = {};
const soundList = [];
function createSimple(filename, rootNote, note, name, displayName) {
    SoundFont[name] = { [rootNote]: "./sounds/" + filename }
    soundList.push({
        refName: name,
        name: displayName,
        note: note,

    });
}


SoundFont.acousticGrandPiano = acousticGrandPiano;
SoundFont.acousticGuitarNylon = acousticGuitarNylon;
SoundFont.violin = violin;
SoundFont.panFlute = panFlute;
SoundFont.tuba = tuba;
SoundFont.altoSax = altoSax;
SoundFont.xylophone = xylophone;
SoundFont.orchestralHarp = orchestralHarp;
SoundFont.timpani = timpani;
SoundFont.kalimba = kalimba;
SoundFont.tubularBells = tubularBells;
SoundFont.drums = {
    A3: "./sounds/Drum.ogg",
    As3: "./sounds/DrumA.ogg",
    B3: "./sounds/DrumB.ogg",
    C4: "./sounds/DrumC.ogg",
    Cs4: "./sounds/DrumD.ogg",
    D4: "./sounds/DrumE.ogg",
    Ds4: "./sounds/DrumF.ogg",
    E4: "./sounds/DrumG.ogg",
    F4: "./sounds/DrumH.ogg",
    Fs4: "./sounds/DrumI.ogg",
    G4: "./sounds/DrumJ.ogg",
    Gs4: "./sounds/DrumK.ogg",
};
SoundFont.covolverImpulses = {
    basic: "./sounds/Convoluters/basic.wav",
    reverb: "./sounds/Convoluters/reverb.wav",
    reverbBigRoom: "./sounds/Convoluters/reverbBigRoom.wav",
    reverbTinShed: "./sounds/Convoluters/reverbTinShed.wav",
    phaseReverbTin: "./sounds/Convoluters/phaseReverbTin.wav",
    factoryHall: "./sounds/Convoluters/factory.hall.wav",
    paInHall: "./sounds/Convoluters/pa.horn.in.hall.wav",
    BMconvolver: "./sounds/Convoluters/BMConvolver.wav",
    BMConReverb: "./sounds/Convoluters/BMConReverb.ogg",
  //  BMEchoReverb: "./sounds/BMConEchoReverb.ogg",
   // BMEchoRevHiPass: "./sounds/BMConEchoReverbHiPass2k.ogg",
   // BMEchoRevLowPass: "./sounds/BMConEchoReverbLoPass1.5k.ogg",
    tubeRadio: "./sounds/Convoluters/blaupunkt.tube.radio.wav",
    church: "./sounds/Convoluters/church.schellingwoude.wav",
    coalhod: "./sounds/Convoluters/coalhod.wav",
    vacuumTube: "./sounds/Convoluters/vacuum.cleaner.tube.wav",
    philipsBoxStereo: "./sounds/Convoluters/70.philips.box.stereo.wav",
    washingMachine: "./sounds/Convoluters/washing.machine.wav",
    tinCan: "./sounds/Convoluters/tin.can.wav",
    marshall1960A: "./sounds/Convoluters/Marshall1960A-G12Ms-TAB57-CapEdgeOffAxis-6in.wav",
};


createSimple("Pipe.wav", "C4", "C3", "organ", "Pipe");
createSimple("PipeRock.wav", "C4", "C3", "rockOrgan", "Rock Pipe");
createSimple("PipeReed.wav", "C4", "C3", "reedOrgan", "Reed Pipe");
createSimple("PipeAccordion.wav", "C4", "C3", "accordionOrgan", "Accordion Pipe");
createSimple("bass.wav", "C4", "C3", "bass", "Bass");
createSimple("fingerBass.wav", "C4", "C3", "fingerBass", "Finger Bass");
createSimple("fretlessBass.wav", "C4", "C3", "fretlessBass", "Fretless Bass");
createSimple("pickedBass.wav", "C4", "C3", "pickedBass", "Picked Bass");
createSimple("slapBass.wav", "C4", "C3", "slapBass", "Slap Base");
createSimple("synthBass.wav", "C4", "C3", "synthBass", "Synth Base");
createSimple("strings.wav", "C4", "C3", "strings", "strings");
createSimple("fiddle.wav", "C4", "C3", "fiddle", "fiddle");
createSimple("horn.wav", "C4", "C3", "horn", "horn");
createSimple("orchestra.wav", "C4", "C3", "orchestra", "orchestra");
createSimple("orchestra2.wav", "C4", "C3", "orchestra2", "orchestra2");
createSimple("panFlute.wav", "C4", "C3", "panFlute", "panFlute");
createSimple("steel.wav", "C4", "C3", "steel", "steel");
createSimple("string2.wav", "C4", "C3", "string2", "string2");
createSimple("strings3.wav", "C4", "C3", "strings3", "strings3");
createSimple("timpani.wav", "C4", "C3", "timpani", "timpani");
createSimple("trumpet.wav", "C4", "C3", "trumpet", "trumpet");
createSimple("tuba.wav", "C4", "C3", "tuba", "tuba");
createSimple("viola.wav", "C4", "C3", "viola", "viola");
createSimple("violin2.wav", "C4", "C3", "violin2", "violin2");

// Warning instrument is dereferenced when fetched to reduce memory footprint
function getInstrument(name) {
    if(name === "list") { return soundList }
    if(name.startsWith("family ")) { return SoundFont[name.split(" ")[1]] }
    const instrument = SoundFont[name];
    SoundFont[name] = undefined;
    return instrument;
}
export {getInstrument};
