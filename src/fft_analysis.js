const path = require('path');
const Python = require('python-shell');

let calcFFT = function (ids) {
  let file = path.join(__dirname, 'src/python/fft_analysis.py');
  let options = {
    args: ids,
  };

  return new Promise((res, rej) => {
    Python.run(file, options, function (err, results) {
      if (err) return rej(err);
      res(results);
    });
  });
}

module.exports = {
  calcFFT
};
