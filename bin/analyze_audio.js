const log = require('../src/log');
const _ = require('lodash');
const { Sample, GenTrack } = require('../src/db');
const spectrogram = require('../src/audio_analysis').spectrogram;

async function run () {
  log.info('Starting audio analysis...');

  while(true) {
    let samples = await Sample.find({spectrogram: {$exists: false}}).select({_id:1}).limit(32);

    if (samples.length == 0) {
      break;
    }

    let ids = samples.map(s => s._id);
    await spectrogram(ids);

    log.info(
      await Sample.count({spectrogram: {$exists: true}}),
      '/',
      await Sample.count()
    );
  }

  log.info('done!');
}

run().catch(console.log).then(process.exit);
