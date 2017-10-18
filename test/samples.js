let assert = require('chai').assert;
let crypto = require('crypto');
let wav = require('node-wav');
let fs = require('fs');

let samples = require('../src/audio_gen').samples;

let song = samples.loadSongFromJSON({
  samples: {
    hat: './test/media/hat.wav',
    kick: './test/media/kick.wav',
    snare: './test/media/snare.wav',
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

describe('Song Generation', () => {
  // Hash Check to make sure it all works
  it('outputs correct wav data from JSON and samples', () => {
    let buffer = fs.readFileSync('test/media/output.wav').toString('base64');

    let result = wav.encode(song.channelData, {
      sampleRate: song.sampleRate,
      float: true,
      bitDepth: 32,
    }).toString('base64');

    let hash1 = crypto.createHash('md5').update(result).digest("hex");
    let hash2 = crypto.createHash('md5').update(buffer).digest("hex");

    assert.equal(hash1, hash2, "Song hashes are different");
  })
});
