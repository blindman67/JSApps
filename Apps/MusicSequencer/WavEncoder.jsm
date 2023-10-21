function encodeSync(audioData, opts = {}) {
  audioData = toAudioData(audioData);
  var floatingPoint = opts.float;
  var bitDepth = floatingPoint ? 32 : ((opts.bitDepth|0) || 16);
  var bytes = bitDepth >> 3;
  var length = audioData.length * audioData.numberOfChannels * bytes;
  var dataView = new DataView(new Uint8Array(44 + length).buffer);
  var writer = createWriter(dataView);
  var format = {
    formatId:           floatingPoint ? 0x0003 : 0x0001,
    floatingPoint:      floatingPoint,
    numberOfChannels:   audioData.numberOfChannels,
    sampleRate:         audioData.sampleRate,
    bitDepth:           bitDepth
  };
  writeHeader(writer, format, dataView.buffer.byteLength - 8);
  writeData(writer, format, length, audioData, opts);
  return dataView.buffer;
}
function encodeWav(audioData, opts) {
  return new Promise(function(resolve) { resolve(encodeSync(audioData, opts)); });
}
function toAudioData(data) {
  return {
      numberOfChannels: data.channelData.length,
      length: data.channelData[0].length,
      sampleRate: data.sampleRate,
      channelData: data.channelData,
  };
}
function writeHeader(writer, format, length) {
  var bytes = format.bitDepth >> 3;
  writer.string("RIFF");
  writer.uint32(length);
  writer.string("WAVE");
  writer.string("fmt ");
  writer.uint32(16);
  writer.uint16(format.floatingPoint ? 0x0003 : 0x0001);
  writer.uint16(format.numberOfChannels);
  writer.uint32(format.sampleRate);
  writer.uint32(format.sampleRate * format.numberOfChannels * bytes);
  writer.uint16(format.numberOfChannels * bytes);
  writer.uint16(format.bitDepth);
}
function writeData(writer, format, length, audioData, opts) {
  var bitDepth = format.bitDepth;
  var encoderOption = format.floatingPoint ? "f" : opts.symmetric ? "s" : "";
  var methodName = "pcm" + bitDepth + encoderOption;
  if (!writer[methodName]) {
    return new TypeError("Not supported bit depth: " + bitDepth);
  }
  var write = writer[methodName].bind(writer);
  var numberOfChannels = format.numberOfChannels;
  var channelData = audioData.channelData;
  writer.string("data");
  writer.uint32(length);
  for (var i = 0, imax = audioData.length; i < imax; i++) {
    for (var ch = 0; ch < numberOfChannels; ch++) {
      write(channelData[ch][i]);
    }
  }
}
function createWriter(dataView) {
  var pos = 0;
  return {
    int16(value) {
      dataView.setInt16(pos, value, true);
      pos += 2;
    },
    uint16(value) {
      dataView.setUint16(pos, value, true);
      pos += 2;
    },
    uint32(value) {
      dataView.setUint32(pos, value, true);
      pos += 4;
    },
    string(value) {
      for (var i = 0; i < value.length; i++) {
        dataView.setUint8(pos++, value.charCodeAt(i));
      }
    },
    pcm8(value) {
      value = Math.max(-1, Math.min(value, +1));
      value = (value * 0.5 + 0.5) * 255;
      value = Math.round(value)|0;
      dataView.setUint8(pos, value, true);
      pos += 1;
    },
    pcm8s(value) {
      value = Math.round(value * 128) + 128;
      value = Math.max(0, Math.min(value, 255));
      dataView.setUint8(pos, value, true);
      pos += 1;
    },
    pcm16(value) {
      value = Math.max(-1, Math.min(value, +1));
      value = value < 0 ? value * 32768 : value * 32767;
      value = Math.round(value)|0;
      dataView.setInt16(pos, value, true);
      pos += 2;
    },
    pcm16s(value) {
      value = Math.round(value * 32768);
      value = Math.max(-32768, Math.min(value, 32767));
      dataView.setInt16(pos, value, true);
      pos += 2;
    },
    pcm24(value) {
      value = Math.max(-1, Math.min(value, +1));
      value = value < 0 ? 0x1000000 + value * 8388608 : value * 8388607;
      value = Math.round(value)|0;
      var x0 = (value >>  0) & 0xFF;
      var x1 = (value >>  8) & 0xFF;
      var x2 = (value >> 16) & 0xFF;
      dataView.setUint8(pos + 0, x0);
      dataView.setUint8(pos + 1, x1);
      dataView.setUint8(pos + 2, x2);
      pos += 3;
    },
    pcm24s(value) {
      value = Math.round(value * 8388608);
      value = Math.max(-8388608, Math.min(value, 8388607));
      var x0 = (value >>  0) & 0xFF;
      var x1 = (value >>  8) & 0xFF;
      var x2 = (value >> 16) & 0xFF;
      dataView.setUint8(pos + 0, x0);
      dataView.setUint8(pos + 1, x1);
      dataView.setUint8(pos + 2, x2);
      pos += 3;
    },
    pcm32(value) {
      value = Math.max(-1, Math.min(value, +1));
      value = value < 0 ? value * 2147483648 : value * 2147483647;
      value = Math.round(value)|0;
      dataView.setInt32(pos, value, true);
      pos += 4;
    },
    pcm32s(value) {
      value = Math.round(value * 2147483648);
      value = Math.max(-2147483648, Math.min(value, +2147483647));
      dataView.setInt32(pos, value, true);
      pos += 4;
    },
    pcm32f(value) {
      dataView.setFloat32(pos, value, true);
      pos += 4;
    }
  };
}

export {encodeWav};