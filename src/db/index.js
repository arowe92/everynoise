const mongoose = require('mongoose');
mongoose.Promise = Promise;

const Genre = require('./genre');
const Track = require('./track');
const Sample = require('./sample');

// URL of the database
const DB_URL = 'rowe-linux/everynoise';

// Open Connection
const connection = mongoose.createConnection(DB_URL);

module.exports = {
  Genre: connection.model('genres', Genre),
  Track: connection.model('tracks', Track),
  Sample: connection.model('sample', Sample)
};
