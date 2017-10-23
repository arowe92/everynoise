const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const wav = require('node-wav');

const {
  scale,
  pan,
  offset,
  resample,
  normalize,
  combine,
} = require('./channelData');

const SAMPLE_RATE = 44100;

// Adjust volume of a sample
function scaleSample(sample, amount) {
  return _.assign({}, sample, {
    channelData: scale(sample.channelData, amount),
    scale: (sample.scale || 1) * amount
  });
}

// Pan a Sample
function panSample(sample, amount) {
  return _.assign({}, sample, {
    channelData: pan(sample.channelData, amount),
    pan: amount,
  });
}

// Resample a wav data object
function resampleSample(sample, targetRate=SAMPLE_RATE) {
  return _.assign({}, sample, {
    channelData: resample(sample.channelData, sample.sampleRate, targetRate),
    sampleRate: targetRate,
  });
}

// wrapper function for samples
function offsetSample(sample, secondsOffset) {
  return _.assign({}, sample, {
    channelData: offset(sample.channelData, secondsOffset, sample.sampleRate),
    sampleRate: sample.sampleRate,
    offset: (sample.offset || 0) + secondsOffset,
  });
}

// Load a wav from the media folder
function loadSampleFromFile(fileName, absolute=false) {
  let name = fileName;

  // Check if path is absolute or an alias
  if (fileName.indexOf('/') !== -1) {
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
  return resampleSample(wavData);
}

// Write wav to a file
function writeSampleToFile(sample, fileName='output.wav') {
  let data = wav.encode(sample.channelData, {
    sampleRate: sample.sampleRate,
    float: true,
    bitDepth: 32,
  });

  fs.writeFileSync(fileName, data);
}

function loadSampleFromWavData(wavData) {
  //  decode the wav data
  wavData = wav.decode(new Buffer(wavData.buffer));

  // Keep track of its offset and volume
  wavData.offset = 0;
  wavData.volume = 1;

  // Resample to 44100
  return resampleSample(wavData);
}

// Loads a song from JSON format into channelData
function loadSongFromJSON(json) {
  let beatsPerMeasure = json.beatsPerMeasure || 4;

  // Beats per second
  let bps = json.bpm / 60;

  // Load samples
  let samples = {};
  for (let name in json.samples) {
    // If channelData is present, its already a sample
    if (json.samples[name].wavData) {
      samples[name] = loadSampleFromWavData(json.samples[name].wavData);
    } else {

      // Otherwise, load it from a file
      samples[name] = loadSampleFromFile(json.samples[name]);
    }
  }

  // Make a list of all buffers that will be combined
  let buffers = [];

  // Add samples into buffers
  for (let event of json.events) {
    let sample = samples[event.sample];

    sample = panSample(sample,event.pan);
    sample = scaleSample(sample, event.volume);

    // time offset
    if (typeof event.offset == 'number') {
      sample = offsetSample(sample, event.offset);

    // Convert offset to beats
    } else if (typeof event.offset == 'string') {
      let [measure, beat] = event.offset.split(':').map(Number);
      sample = offsetSample(sample, (--measure * beatsPerMeasure + beat) / bps);

    } else if (typeof event.measure == 'number') {
      let {measure, beat} = event;
      sample = offsetSample(sample, (--measure * beatsPerMeasure + beat) / bps);
    }

    // Add to list of buffers to be stacked
    buffers.push(sample.channelData);

    // if list gets too long, condense it
    if (buffers.length > 100) {
      let buffers = [combine(buffers)];
    }
  }

  // Create song
  let channelData = combine(buffers);

  // get noramlized Data
  channelData = normalize(channelData);

  return {
    channelData,
    sampleRate: SAMPLE_RATE,
  }
}

module.exports = {
  scaleSample,
  panSample,
  resampleSample,
  offsetSample,
  loadSampleFromFile,
  writeSampleToFile,
  loadSongFromJSON,
};
