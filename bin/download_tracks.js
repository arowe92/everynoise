const log = require('../log');
const { Track } = require('../db');

async function run () {
  log.info('Downloading all mp3s');

  // Count eligible tracks
  const count = await Track.findNotDownloaded().count();
  log.info(count, 'valid tracks to fetch metadata for');

  while (true) {
    // Display progress
    log.info(count - await Track.findNotDownloaded().count(), '/', count, 'remaining');

    // Get next 100 tracks
    const tracks = await Track.findNotDownloaded().limit(10);

    // If no track left, break
    if (tracks.length == 0) break;

    // Save track
    for (let track of tracks) {
      await track.fetchMP3();
      await track.save();
    }
  }

  // Display stats
  let valid = await Track.find().count();
  let invalid = await Track.findNotDownloaded().count();
  let perc = Math.round(100 * (valid - invalid)/valid);
  log.info(`${valid - invalid}/${valid} tracks have mp3s (${perc}%)`);
  log.info(`done`);
}

run().then(process.exit).catch(log.error);
