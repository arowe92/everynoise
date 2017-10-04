const log = require('../src/log');
const { getAllGenres } = require('../src/scraper.js');
const { Genre } = require('../src/db');

async function run () {
  log.info('Getting all genres...')
  let genres = await getAllGenres();

  log.info('Found', genres.length);
  try {
    await Genre.collection.insert(genres, {
      ordered: false
    });
  } catch (e) {
    // catch the duplicate error code
    if (e.code == 11000) {
      log.warning('Duplicates Found');
    } else {
      throw e;
    }
  }

  log.info('Successfully created genres');
  let count = await Genre.findValid().count();

  log.info(`${count}/${genres.length} are valid`);
  log.info(`done`);
}

run().catch(log.error).then(process.exit);
