const log = require('../src/log');
const { Sample } = require('../src/db');
const walkSync = require('../src/utility/files').walkSync;

async function run () {
  let sample = await Sample.findRandomOfType('hat');
  log('debug');
  log(sample);
}

run().catch(log.error).then(process.exit);
