const mongoose = require('mongoose');
mongoose.Promise = Promise;

const Genre = require('./genre');
const Track = require('./track');
const Sample = require('./sample');
const GenTrack = require('./GenTrack');

// URL of the database
const DB_URL = 'localhost/everynoise';

// Open Connection
const connection = mongoose.createConnection(DB_URL);

module.exports = {
  Genre: connection.model('genres', Genre),
  Track: connection.model('tracks', Track),
  GenTrack: connection.model('generated_tracks', GenTrack),
  Sample: connection.model('sample', Sample)
};
