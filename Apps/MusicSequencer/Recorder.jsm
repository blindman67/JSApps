import {downloadBlob} from "./FileIO.jsm";
async function Recorder(synth) {
    const constraints = { audio: true, video: false};
    const chunks = [];
    var filename, size = 0, startTime;
    var atx = synth.context;


    //const stream = await navigator.mediaDevices.getUserMedia(constraints);
    var mediaRecorder;
    function record() {
        var dest = atx.createMediaStreamDestination();
        synth.connect(dest);
        mediaRecorder = new MediaRecorder(dest.stream);


        mediaRecorder.addEventListener("stop", event => {
            API.recording = false;
            synth.disconnect(dest);
            if (filename) {
                downloadBlob(new Blob(chunks, {"type": "audio/ogg; codecs=opus"}), filename);
            }
            synth.infoElement.textContent = ((performance.now() - startTime) / 1000).toFixed(2);
            synth.infoElement.textContent += "sec " + chunks.reduce((n,c) => n + c.length, 0) + "bytes";
            chunks.length = 0;
        });
        mediaRecorder.addEventListener("dataavailable", event => {
            size += event.data.length;
            chunks.push(event.data);
        });
        mediaRecorder.start();
        function monitor() {
            if (API.recording) {
                synth.infoElement.textContent = ((performance.now() - startTime) / 1000).toFixed(2) + "sec";
                setTimeout(monitor, 250);
            }
        }
        startTime = performance.now();
        API.recording = true;
        synth.infoElement.textContent = "RECORDING!";
        setTimeout(monitor, 250);
    }

    const API = {
        recording: false,
        set audioContext(val) { atx = val },
        start() {
            if (atx) {
                record();

                return true;
            }
        },
        stop(save, name) {
            if (API.recording) {
                if (save) { filename = name }
                else { filename = "" };
                mediaRecorder.stop();
                return true;
            }
        },
    };
    return API;
}

export {Recorder};


/*
let timeInterval = 3000;
let recording;
let sampleRate;
let requesttimer;
async function record(constraints) {
  let stream = null;
  recording = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log(stream);
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(1024, 1, 1);
    source.connect(processor);
    processor.connect(context.destination);

    requesttimer = setInterval(exportBuffer, timeInterval);

    processor.onaudioprocess = function(e) {
      if (!recording) {
        exportBuffer();
        clearInterval(requesttimer);
        context.close();
      }
      sampleRate = e.inputBuffer.sampleRate;
      record2(e.inputBuffer.getChannelData(0));
    };

  } catch(err) {
  }
}

function stop(){
  recording = false;
}

var recLength = 0,
    recBuffer = [];

function record2(inputBuffer) {
  recBuffer.push(inputBuffer[0]);
  recLength += inputBuffer[0].length;
}

function exportBuffer() {
 var mergedBuffers = mergeBuffers(recBuffer, recLength);
 var downsampledBuffer = downsampleBuffer(mergedBuffers, 16000);
 var encodedWav = encodeWAV(downsampledBuffer);
 var audioBlob = new Blob([encodedWav], { type: 'application/octet-stream' });
 postMessage(audioBlob);
}

function mergeBuffers(bufferArray, recLength) {
  var result = new Float32Array(recLength);
  var offset = 0;
  for (var i = 0; i < bufferArray.length; i++) {
    result.set(bufferArray[i], offset);
    offset += bufferArray[i].length;
  }
  return result;
}

function downsampleBuffer(buffer) {
  if (16000 === sampleRate) {
    return buffer;
  }
  var sampleRateRatio = sampleRate / 16000;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Float32Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;
  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0,
      count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

function floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++, offset += 2) {
        let s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
}

function encodeWAV(samples) {
  var buffer = new ArrayBuffer(44 + samples.length * 2);
  var view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 32 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  floatTo16BitPCM(view, 44, samples);

  return view;
}

function postMessage(data){
  console.log(data);
  recLength = 0;
  recBuffer = [];
}
*/