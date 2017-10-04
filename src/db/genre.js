const { Schema } = require('mongoose');

// Genre Model
const Genre = new Schema({
  preview_url: String,
  htmlResponse: String,
  name: String,

  link: {
    type: String,
    unique: true
  },

  tracks: [Schema.Types.ObjectId],
});

Genre.statics.findValid = function () {
  return this.find({
    link: { $nin: ['', null]}
  });
}

module.exports = Genre;
