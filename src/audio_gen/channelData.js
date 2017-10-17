const fs = require('fs');
const _ = require('lodash')
const wav = require('node-wav');

// Defaults
let SAMPLE_RATE = 44100;
let CHANNELS = 2;

// Normalize N-D buffers together
function normalize(channelData) {
  // get a maximum of all
  let max = _(channelData).map(_.max).max();
  return scale(channelData, 1/max);
}

// Adjust volumes of channel data
function scale(channelData, scale) {
  // normalize All Channels
  return channelData.map(
    channel => channel.map(x => x * scale)
  );
}

function pan(channelData, pan=0.5) {
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

/**
 * Combine multi-channel data
 */
function combine(channelDatas, channels=CHANNELS) {
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

// resamples a song from one rate to another
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

// Write wav to a file
function writeToFile(channelData, fileName='output.wav') {
  let data = wav.encode(channelData, {
    sampleRate: SAMPLE_RATE,
    float: true,
    bitDepth: 32,
  });
  fs.writeFileSync(fileName, data);
}

// Offset channel Data by a duration in seconds
function offset (channelData, secondsOffset, sampleRate=SAMPLE_RATE) {
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

module.exports = {
  normalize,
  pan,
  scale,
  offset,
  writeToFile,
  combine,
  resample,
}
