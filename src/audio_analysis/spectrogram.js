const path = require('path');
const Python = require('python-shell');

let spectrogram = function (ids) {
  if (typeof ids === 'string') {
    ids = [ids];
  }

  let file = './src/python/spectrogram.py';
  let options = {
    type: 'json',
    args: ids,
  };

  return new Promise((res, rej) => {
    Python.run(file, options, function (err, results) {
      if (err) {
        return rej(err);
      }
      res(results);
    });
  });
}

module.exports = {
  spectrogram
};
