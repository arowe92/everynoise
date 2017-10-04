const log = require('color-logs')(true, true, __filename)
const { getTracksFromGenre, addMetadataToTracks } = require('../scraper.js');
const { Genre, Track } = require('../db');

async function run () {
  log.info('Getting all Tracks...')
  let genres = await Genre.findValid();

  for (let i in genres) {
    log.info(`Genre ${i+1}/${genres.length}`);
    let tracks = await getTracksFromGenre(genres[i]);

    log.info(`${tracks.length} tracks fetched, getting metadata`);
    await addMetadataToTracks(tracks);

    log.info(`Saving tracks...`);
    await Track.create(tracks);
  }

  let valid = await Track.find().count();
  let invalid = await Track.findValid().count();
  let perc = Math.round(100 * invalid/valid);
  log.info(`${invalid}/${valid} tracks are invalid (${perc}%)`);
  log.info(`done`);
}

run().then(process.exit).catch(log.error);
