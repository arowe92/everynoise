const fs = require('fs');
const path = require('path');
const log = require('easy-fun-log');
const _ = require('lodash')
const wav = require('node-wav');
const { loadMidiFile } = require('./midi');

// Defaults
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

  // Check if path is absolute or an alias
  if (fileName.indexOf('/') != -1) {
    absolute = true;
  }

  if (!absolute) {
    fileName = path.join(__dirname, '../../media', fileName);
  }

  if (fileName.split('.').pop() != 'wav') {
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
function writeChannelData(channelData, fileName='output.wav', options = {
  sampleRate: SAMPLE_RATE,
  float: true,
  bitDepth: 32,
}) {

  let data = wav.encode(channelData, options);
  fs.writeFileSync(fileName, data);
}

// Offset channel Data by a duration in seconds
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

// wrapper function for samples
function offsetSample(sample, secondsOffset) {
  return _.assign({}, sample, {
    channelData: offsetChannelData(sample.channelData, secondsOffset, sample.sampleRate),
    sampleRate: sample.sampleRate,
    offset: (sample.offset || 0) + secondsOffset,
  });
}

// Load
function createSampleFromJSON(json) {
  return {
    channelData: loadChannelDataFromJSON(json),
    bitDepth: 32,
    float: true,
    sampleRate: SAMPLE_RATE,
  }
}

// Loads a song from JSON format into channelData
function loadChannelDataFromJSON(json) {
  let beatsPerMeasure = json.beatsPerMeasure || 4;

  // Beats per second
  let bps = json.bpm / 60;

  // Load samples
  let samples = {};
  for (let name in json.samples) {
    samples[name] = loadSample(json.samples[name]);
  }

  // Make a list of all buffers that will be combined
  let buffers = [];

  // Add samples into buffers
  for (let event of json.events) {
    let sample = loadSample(event.sample);

    sample = panSample(sample,event.pan);
    sample = scaleSample(sample, event.volume);

    // time offset
    if (typeof event.offset == 'number') {
      sample = offsetSample(sample, event.offset);

    // Convert offset to beats
    } else if (typeof event.offset == 'string') {
      let [measure, beat] = event.offset.split(':').map(Number);
      sample = offsetSample(sample, (--measure * beatsPerMeasure + beat) / bps);
    }

    // Add to list of buffers to be stacked
    buffers.push(sample.channelData);

    // if list gets too long, condense it
    if (buffers.length > 100) {
      let buffers = [combineChannelData(buffers)];
    }
  }

  // Create song
  let song = combineChannelData(buffers);

  // Return noramlized Data
  return normalizeChannelData(song);
}

let song = loadChannelDataFromJSON({
  samples: {
    hat: 'hat.wav',
    kick: 'kick.wav',
    snare: 'snare.wav',
  },
  bpm: 180,
  beatsPerMeasure: 4,
  events: [
    {offset: '1:1', sample: 'kick', volume: 0.5, pan: 0.5},
    {offset: '1:2', sample: 'hat', volume: 0.2, pan: 0.0},
    {offset: '1:3', sample: 'snare', volume: 0.8, pan: 0.5},
    {offset: '1:4', sample: 'hat', volume: 0.8, pan: 1.0},

    {offset: '2:1', sample: 'kick', volume: 0.5, pan: 0.5},
    {offset: '2:2', sample: 'hat', volume: 0.2, pan: 0.0},
    {offset: '2:3', sample: 'snare', volume: 0.8, pan: 0.5},
    {offset: '2:3.666', sample: 'hat', volume: 0.8, pan: 0.5},
    {offset: '2:4.333', sample: 'hat', volume: 0.8, pan: 0.5},
    {offset: '2:5.', sample: 'hat', volume: 0.8, pan: 0.5},
    {offset: '2:5.666', sample: 'hat', volume: 0.8, pan: 0.5},
    {offset: '2:6.333', sample: 'hat', volume: 0.8, pan: 0.5},
    {offset: '2:7', sample: 'hat', volume: 0.8, pan: 0.5},

    {offset: '3:1', sample: 'kick', volume: 0.5, pan: 0.5},
    {offset: '3:3', sample: 'snare', volume: 0.8, pan: 0.5},
  ]
});

writeChannelData(song);

module.exports = {
  createSampleFromJSON
};
