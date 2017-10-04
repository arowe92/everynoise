const log = require('../src/log');
const { addMetadataToTracks } = require('../src/scraper.js');
const { Track } = require('../src/db');

async function run () {
  log.info('Getting all track metadata');

  // Count eligible tracks
  const count = await Track.find({id: {$nin: [null, '']}}).count();
  log.info(count, 'valid tracks to fetch metadata for');

  while (true) {
    // Display progress
    log.info(count - await Track.findNoMetadata().count(), '/', count, 'remaining');

    // Get next 100 tracks
    const tracks = await Track.findNoMetadata().limit(100);

    // If no track left, break
    if (tracks.length == 0) break;
    const updatedTracks = await addMetadataToTracks(tracks);

    // Save track
    for (let track of updatedTracks) {
      await track.save();
    }
  }

  // Display stats
  let valid = await Track.find().count();
  let invalid = await Track.findNoMetadata().count();
  let perc = Math.round(100 * (valid - invalid)/valid);
  log.info(`${valid - invalid}/${valid} tracks have metadata (${perc}%)`);
  log.info(`done`);
}

run().then(process.exit).catch(log.error);
