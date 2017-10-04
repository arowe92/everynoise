const request = require('request-promise');
const { Schema } = require('mongoose');

let Track = new Schema({
  id: {},

  // Link to the track metadata
  link: {
    type: String,
    unique: true
  },

  // Artist name
  artist: String,

  // Genre info
  genre: Schema.Types.ObjectId,
  genre_name: String,
  genre_link: String,

  // URL to the preview
  preview_url: String,

  // mp3 Data Buffer
  mp3Data: Buffer,

  // Full scraped data from web
  metadata: Object,
});

/**************************
 * Static Methods
 *************************/
Track.statics.findNotDownloaded = function () {
  return this.find({
    id: { $nin: ['', null] },
    mp3Data: { $exists: false },
    preview_url: { $nin: ['', null] }
  });
}

// Find tracks that have an ID but no metadata
Track.statics.findNoMetadata = function () {
  return this.find({
    id: {
      $nin: [null, '']
    },
    metadata: {
      $in: [undefined, null, '']
    }
  })
}

Track.statics.findValid = function () {
  return this.find({
    preview_url: {
      $nin: ['', null]
    }
  });
}

/**************************
 * Instance Methods
 *************************/
Track.methods.fetchMP3 = async function () {
  const requestSettings = {
    method: 'GET',
    url: this.metadata.preview_url,
    encoding: null,
  };

  this.mp3Data = await request(requestSettings);
}

module.exports = Track;
