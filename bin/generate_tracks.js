const log = require('../src/log');
const _ = require('lodash');
const { Sample, GenTrack } = require('../src/db');

async function run () {
  let samples = await Sample.findRandomOfTypes();

  let track = await GenTrack.createRandom(samples);
  await track.generateWavData();
  await track.save();
}

run().catch(console.log).then(process.exit);
