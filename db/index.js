const mongoose = require('mongoose');
mongoose.Promise = Promise;

const Genre = require('./genre');
const Track = require('./track');

// URL of the database
const DB_URL = '192.168.0.223/everynoise';

// Open Connection
const connection = mongoose.createConnection(DB_URL);

module.exports = {
  Genre: connection.model('genres', Genre),
  Track: connection.model('tracks', Track)
};
