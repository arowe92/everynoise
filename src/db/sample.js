const { Schema } = require('mongoose');
const md5 = require('md5');
const wav = require('node-wav');
const path  = require('path');
const fs = require('fs');
const log = require('easy-fun-log');

const { walkSync } = require('../utility/files');
const calcSpectrogram = require('../audio_analysis').spectrogram;

let Sample = new Schema({
  fileName: {
    required: true,
    type: String,
  },

  loadedFrom: {
    type: String,
  },

  // Crash, hi-hat, etc
  type: {
    required: true,
    type: String,
  },
  tags: {
    type: [String],
    default: Array,
  },

  sampleRate: Number,
  channels: Number,
  wavData: Buffer,

  spectrogram: {
    frequencies: Array,
    times: Array,
    data: [Array],
  },

  hash: {
    type: String,
    unique: true,
  },

  created_at: {
    default: Date.now,
    type: Date
  }
});

/**************************
 * Hook Methods
 *************************/
Sample.pre('save', async function (next) {
  // set Hash
  this.hash = md5(this.wavData.toString('base64'));

  let dupe = await this.constructor.findOne({hash: this.hash});

  if (dupe && dupe.loadedFrom != this.loadedFrom) {
    return next(new Error(`Duplicate Hashes: ${this.loadedFrom}, ${dupe.loadedFrom}`));
  }

  try {
    // Set wav
    let data = wav.decode(this.wavData);
    this.sampleRate = data.sampleRate;
    this.channels = data.channels;
  } catch (e) {
    this.invalidate('wavData', 'Error Decoding Data');
    return next(new Error(`Error Decoding Wav File: ${this.loadedFrom}`));
  }

  // Set default tags
  if (this.tags.length == 0) {
    this.tags = [this.type];
  }
  next();
});

Sample.post('init', function(doc){
  if (doc.wavData) {
    doc.channelData = wav.decode(new Buffer(doc.wavData.buffer)).channelData;
  }
});

/**************************
 * Static Methods
 *************************/
Sample.statics.findRandomOfType = async function (type, size=1) {
  return this.aggregate({
    $match: { type },
  }).sample(size);
}

Sample.statics.findRandomOfTypes = async function (types) {
  if (typeof types == 'undefined') {
    types = await this.distinct('type');
  }
  
  let samples = {};

  for (let t of types) {
    samples[t] = (await this.findRandomOfType(t))[0];
  }

  return samples;
}

Sample.statics.createFromFile = async function (fileName, type, tags=[], uniqueFilename=true) {

  if (uniqueFilename && await this.count({loadedFrom: fileName})) {
    let e = new Error(`File Path Already Uploaded: ` + fileName);
    // Mongoose code for duplicate
    e.code = 11001;
    throw e;
  }

  // If type is not set, set it to parent folder
  if (!type) {
    type = path.dirname(fileName).split(path.sep).pop();
  }

  let wavData = fs.readFileSync(fileName);

  return this.create({
    fileName: fileName.split(path.sep).pop(),
    loadedFrom: fileName,
    wavData,
    type,
    tags,
  });
}

Sample.statics.uploadDirectoryRecursive = function (dir, tags=[]) {
  let files = walkSync(dir, '.wav');
  let docs = [];
  let errors = 0;

  // Create promises so we can make them in parallel
  return new Promise((resolve) => {
    files.map(async f => {
      try {
        let doc = await this.createFromFile(f)
        docs.push(doc);
      } catch (e) {
        log.error('error creating sample', e)
        errors++;
      }

      // If all are fone, then complete promises
      if (docs.length + errors == files.length) {
        resolve(docs);
      }
    });
  });
}


/**************************
 * Instance Methods
 *************************/
Sample.methods.calcSpectrogram = async function () {
  this.fftData = await calcSpectrogram([this._id])[0];
  return this;
}

module.exports = Sample;
