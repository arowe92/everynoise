const fs = require('fs');
const path = require('path');
const log = require('easy-fun-log');
const _ = require('lodash')
const wav = require('node-wav');

let SAMPLE_RATE = 44100;
let CHANNELS = 2;

// Normalize N-D buffers together
function normalizeChannelData(channelData) {
  // get a maximum of all
  let max = _(channelData).map(_.max).max();
  return scaleChannelData(channelData, 1/max);
}

// Normalize a 1-D buffer
function normalize(buffer) {
  const max = _.max(buffer);
  return _.map(buffer, x => x / max);
}

// Adjust volumes of channel data
function scaleChannelData(channelData, scale) {
  // normalize All Channels
  return channelData.map(
    channel => channel.map(x => x * scale)
  );
}

// Adjust volume of a sample
function scaleSample(sample, scale) {
  return _.assign({}, sample, {
    channelData: scaleChannelData(sample.channelData, scale),
    scale: (sample.scale || 0) * scale
  });
}

function panChannelData(channelData, pan=0.5) {
  let output = [
    new Float32Array(channelData[0].length),
    new Float32Array(channelData[0].length)
  ];

  for (let i in channelData[0]) {
    let c = channelData.length == 1 ? 0 : 1;
    output[0][i] = channelData[0][i] * 2 * pan;
    output[1][i] = channelData[c][i] * 2 * (1 - pan);
  }

  return output;
}

function panSample(sample, pan) {
  return _.assign({}, sample, {
    channelData: panChannelData(sample.channelData, pan),
    pan,
  });
}

function splitMonoChannelData(channelData) {
  return panChannelData(channelData, 0.5);
}

/**
 * Combine multi-channel data
 */
function combineChannelData(channelDatas, channels=2) {
  let output = new Array(channels);

  for (let i = 0; i < channels; i++) {
    output[i] = combineBuffers(channelDatas.map(cd => {
      // if data is one channel, revert to first channel
      if (i >= cd.length) return cd[0];

      return cd[i];
    }));
  }

  return output;
}

// Add two buffers together
// NOT ChannelData
function combineBuffers(buffers) {
  const sizes = buffers.map(b => b.length);
  const max = _.max(sizes);
  const output = new Float32Array(max);

  for (let i = 0; i < max; i++) {
    output[i] += _.reduce(buffers, (sum, buf) => {
      if (i >= buf.length) {
        return sum;
      }
      return sum + buf[i];
    }, 0);
  }

  return output;
}

function createEmptySong(duration) {
  let totalSamples = duration * SAMPLE_RATE;

  // Create Channel Data and fill with 32 float arrays
  let channelData = _.map(new Array(CHANNELS), () => new Float32Array(totalSamples));
  return channelData;
}

function resample(channelData, sourceRate, targetRate=SAMPLE_RATE) {
  // Duration of sample
  let duration = channelData[0].length / sourceRate;

  // New sample counts
  let newSampleCount = duration * targetRate;

  // Iterate for each channel
  let output = [];
  for (let c = 0; c < channelData.length; c++) {
    output[c] = new Float32Array(newSampleCount);

    // iterate over the buffer and get closest sample
    for(let i = 0; i < newSampleCount; i++) {
      let j = Math.floor(i * channelData[0].length / newSampleCount);
      output[c][i] = channelData[c][j];
    }
  }

  return output;
}

// Resample a wav data object
function resampleWav(sample, targetRate=44100) {
  return _.assign({}, sample, {
    channelData: resample(sample.channelData, sample.sampleRate, targetRate),
    sampleRate: targetRate,
  });
}

// Load a wav from the media folder
function loadSample(fileName, absolute=false) {
  let name = fileName;

  if (!absolute) {
    fileName = path.join(__dirname, '../../media', fileName);
    fileName += '.wav';
  }

  // Load file data
  let fileData = fs.readFileSync(fileName);

  //  decode the wav data
  let wavData = wav.decode(fileData);

  // Add filename for convenience
  wavData.name = name;

  // Keep track of its offset and volume
  wavData.offset = 0;
  wavData.volume = 1;

  // Resample to 44100
  return resampleWav(wavData);
}

// Write wav to a file
function writeChannelData(channelData, fileName, options = {
  sampleRate: SAMPLE_RATE,
  float: true,
  bitDepth: 32,
}) {

  let data = wav.encode(channelData, options);
  fs.writeFileSync('output/output.wav', data);
}

function offsetChannelData (channelData, secondsOffset, sampleRate=SAMPLE_RATE) {
  // Total duration of the sample with the silence before
  let totalDuration = channelData[0].length / sampleRate + secondsOffset;

  // Total count of samples
  let sampleCount = Math.floor(sampleRate * totalDuration);

  // Length of the zeroes before the sample
  let zeroLength = sampleCount - channelData[0].length;

  // Concat the data onto the zeroes
  return _.map(channelData, cd => {
    let output = _.fill(new Float32Array(sampleCount), 0);

    // start at end of zero buffer
    for (let i = zeroLength, j = 0; i < sampleCount; i++) {
      output[i] = cd[j++];
    }

    return output;
  });
}

function offsetSample(sample, secondsOffset) {
  return _.assign({}, sample, {
    channelData: offsetChannelData(sample.channelData, secondsOffset, sample.sampleRate),
    sampleRate: sample.sampleRate,
    offset: (sample.offset || 0) + secondsOffset,
  });
}

let wav1 = loadSample('ahem_x');
let wav2 = loadSample('baseball_hit');

// wav2 = offsetSample(wav2, 1);
let wav3 = offsetSample(wav2, 1);
wav3 = panSample(wav3, 0);

let wav4 = offsetSample(wav2, 2);
wav4 = panSample(wav4, 0.5);

let out = combineChannelData([wav1.channelData, wav2.channelData, wav3.channelData, wav4.channelData], 2);
out = normalizeChannelData(out);
writeChannelData(out);
