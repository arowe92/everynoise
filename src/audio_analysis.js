const log = require('./log');
const flow = require('promise-control-flow');
const load = require('audio-loader');

const getBufferFromMp3 = (buffer) => {
  return load(buffer);
};

const getFFTFromMp3()
