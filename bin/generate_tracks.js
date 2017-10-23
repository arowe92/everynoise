const log = require('../src/log');
const wav = require('node-wav');
const _ = require('lodash');
const { Sample } = require('../src/db');
const { loadSongFromJSON, writeSampleToFile } = require('../src/audio_gen').samples;

const LENGTH = 5;

const SONGS = 1;

const types = [
  'hat',
  'kick',
  'snare',
];

async function getSamples() {
  let samples = {};

  for(let type of types) {
    samples[type] = (await Sample.findRandomOfType(type))[0];
    // samples[type].channelData = wav.decode(new Buffer(samples[type].wavData.buffer)).channelData;
  }

  return samples;
}

function genSong(samples) {
  let song = {
    samples,
    bpm: Math.round(Math.random() * 100 + 80),
    beatsPerMeasure: 4,
    events: [],
  };

  for (let i = 0; i < 100; i++) {
    let event = {};

    // Give it a position in song
    event.measure = Math.floor(Math.random() * LENGTH) + 1;

    event.beat = Math.floor(Math.random() * 4);
    // event.offset = Math.random() * LENGTH;

    // Pan Randomly
    event.pan = Math.random();

    // Get random sample
    event.sample = _.sample(types);

    event.volume = Math.random();

    song.events.push(event);
  }

  return song;
}

async function run () {
  let songs = [];

  for (let i = 0; i < SONGS; i++) {
    let samples = await getSamples();
    let song = genSong(samples);
    songs.push(song);
  }

  let song = await loadSongFromJSON(songs[0]);
  writeSampleToFile(song);
}

run().catch(console.log).then(process.exit);
