const log = require('../src/log');
const { Sample } = require('../src/db');
const walkSync = require('../src/utility/files').walkSync;

let dirname = process.argv[2];
let tags = process.argv.slice(2);

if (!dirname) {
  log.error('Need directory to upload!');
  process.exit();
}

async function run () {
  log.info('Loading samples from ' + dirname);

  let files = walkSync(dirname, '.wav');
  let success = 0;
  let errors = 0;
  let codes = {};

  log.info('Files to upload: ' + files.length);

  for (let i in files) {
    try {
      // Create promises so we can make them in parallel
      await Sample.createFromFile(files[i]);
      success++;
    } catch (e) {
      errors++;

      if (e.code != 11000) {
        log.error(e.message);
      }

      if (!codes[e.code]) {
        codes[e.code] = 0;
      }
      codes[e.code]++;
    }

    if (success + errors % 25 == 0) {
      log.error(success + errors, '/', files.length);
    }
  }
  log.info(`done!`);

  log.info(errors, 'errors');
  log.info(success, 'uploaded');
  log.info('Error codes count:', codes);
  log.info(Math.round(success/files.length * 100), '% success');
}

run().catch(log.error).then(process.exit);
