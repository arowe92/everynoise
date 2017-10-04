const log = require('./log');
const request = require('request-promise');
const cheerio = require('cheerio');
const flow = require('promise-control-flow');

// Everynoise Root URL
const EVERYNOISE_URL = 'http://everynoise.com/';

/**
 * Fetches a list of all genres
 * @return [Genre] Array of Genre Models (unsaved)
 */
const getAllGenres = async () => {
  // Get HTML
  let html = await request({
    url: EVERYNOISE_URL + 'engenremap.html'
  });

  // Load into scraper
  let $ = cheerio.load(html);

  let genres = [];
  $('.canvas').find('div').each((e, el) => {
    // Get the link to the genre
    let links = $(el).find('a');

    // Create the DB Entry, add to list
    let genre = {
      // Link (Some genres dont have link?
      link: links.length ? $(links[0]).attr('href') : null,
      preview: $(el).attr('preview_url'),
      htmlResponse: $(el).html(),
      name: $(el).text().split('»')[0],
    };

    genres.push(genre);
  });

  return genres;
}

/**
 * Get all tracks from a genre
 * @param  Genre  genre Genre model object
 * @return [Track] Array of Track Models (unsaved)
 */
const getTracksFromGenre = async (genre) => {
  // Get HTML
  let html = await request({
    url: EVERYNOISE_URL + genre.link
  });

  // Load into cheerio
  let $ = cheerio.load(html);

  let tracks = []
  $('.canvas').find('div').each((e, el) => {
    let links = $(el).find('a');

    // Create track
    let track = {
      id: $(el).attr('onclick').split('"')[1],
      link: links.length ? $(links[0]).attr('href') : null,
      htmlResponse: $(el).html(),
      preview: $(el).attr('preview_url'),
      artist: $(el).text().split('»')[0],
      genre: genre._id,
      genre_link: genre.link,
      genre_name: genre.name,
    };

    tracks.push(track);
  });

  return tracks;
}

/**
 * Add Metadata to tracks
 * @param  [Track] tracks Array of Track Models
 * @return [Track] Updated array of Track Models (unsaved)
 */
const addMetadataToTracks = async (tracks) => {
  // Only get tracks with IDS
  tracks = tracks.filter(t => t.id && !t.metadata);
  log.info('Getting metadata for', tracks.length, 'tracks');

  let status = 0;
  // Fetch meta data in Parallel
  let promises = tracks.map(track => async () => {
    // Try to get metadata
    try {
      let response = await request({
        url: EVERYNOISE_URL + 'spotproxy.cgi?track=' + track.id
      });
      track.metadata = JSON.parse(response);
      track.preview_url = track.metadata.preview_url;
    } catch (e) {
      log.error(`Error getting metadata for track id:${track.id}`);
      track.metadata = null;
      track.preview_url = null;
    }

    if (status++ % 25 == 24) {
      log.info(status, '/', tracks.length);
    }
  });

  await flow.parallel(promises, 10);
  return tracks;
}

module.exports = {
  getAllGenres,
  getTracksFromGenre,
  addMetadataToTracks
};
