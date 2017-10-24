const { Schema } = require('mongoose');
const _ = require('lodash');
const wav = require('node-wav');

const { createSampleFromJSON } = require('../audio_gen').samples;

let GenTrack = new Schema({
  sampleList: [{
    type: Schema.Types.ObjectId,
    ref: 'sample'
  }],
  beatsPerMeasure: Number,
  bpm: Number,
  events: [{
    sample: String,
    offset: Number,
    volume: Number,
    pan: Number,
    measure: Number,
    beat: Number
  }],
  wavData: Buffer,
  created_at: {
    type: Date,
    default: Date.now
  }
});

GenTrack.virtual('samples').set(function (samples) {
  this.sampleList = _(samples).values().map(s=>s._id).value();
});

GenTrack.virtual('samples').get(function () {
  return _.keyBy(this.sampleList, 'type');
});

/**************************
 * Static Methods
 *************************/
GenTrack.statics.createRandom = async function (samples, length=10, bpm=0, beatsPerMeasure=4) {
  // Samples looks like:
  // {
  //  hat: (ObjectID),
  //  kick: (ObjectID),
  // }
  let track = {
    samples,
    bpm: bpm || Math.round(Math.random() * 100 + 60),
    beatsPerMeasure,
    events: [],
  };

  for (let i = 0; i < 100; i++) {
    let event = {};

    // Give it a position in song
    event.measure = Math.floor(Math.random() * length) + 1;
    event.beat = Math.random() * 4;

    // event.offset = Math.random() * length;

    // Pan and volume Randomly
    event.pan = Math.random();
    event.volume = Math.random();

    // Get random sample
    event.sample = _.sample(_.keys(samples));

    track.events.push(event);
  }

  return new this(track);
}

/**************************
 * Instance Methods
 *************************/
// Populate the samples id => models
GenTrack.methods.populateSamples = async function () {
  await this.populate('sampleList').execPopulate();
  return this;
}

// Convert the event data into wavData
GenTrack.methods.generateWavData = async function () {
  await this.populateSamples();

  let data = createSampleFromJSON(this);
  this.wavData = wav.encode(data.channelData, data);
}

module.exports = GenTrack;
