const log = require('../src/log');
const { Genre, Track } = require('../src/db');

const perc = (n1, n2) => `(${Math.round(100 * n1/n2)}%)`.yellow;

async function run () {
  log.info('Database statistics');

  log.info('Genres:', await Genre.count());

  // Count eligible tracks
  const total = await Track.count();
  log.info('Total Tracks:', total);


  const noId = await Track.count({id: {$in: [undefined, null, '']}});
  log.info('No ID / Broken:', noId, perc(noId, total));

  const noMetadata = await Track.findNoMetadata().count();
  log.info('No Metadata (eligible):', noMetadata);

  const metadata = await Track.count({preview_url: { $nin: ['', null]}});
  log.info('Metadata:', metadata, perc(metadata, total));

  const downloaded = await Track.count({mp3Data: {$exists: true}});
  log.info('Downloaded:', downloaded, perc(downloaded, total));

  const notDownloaded = await Track.findNotDownloaded().count();
  log.info('Not Downloaded (eligible):', notDownloaded);
}

run().then(process.exit).catch(log.error);
