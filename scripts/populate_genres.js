const log = require('color-logs')(true, true, __filename)
const { getAllGenres } = require('../scraper.js');
const { Genre } = require('../db');

async function run () {
  log.info('Getting all genres...')
  let genres = await getAllGenres();

  log.info('Found ' + genres.length);
  await Genre.create(genres);

  log.info('Successfully created genres');
  let count = await Genre.findValid().count();

  log.info(`${count}/${genres.length} genres did not have links`);
  log.info(`done`);
}

run().then(process.exit).catch(log.error);
