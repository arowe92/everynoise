let assert = require('chai').assert;
let _ = require('lodash');

let cd = require('../src/audio_gen/channelData.js');

const data = [
  [0, 25, 5, 75, 8],
  [5, 5 , 5, 5 , 5],
];

function ftoi(a) {
  let b = [];
  for (let i in a) {
    b.push(new Int32Array(a[i]));
  }
  return b;
}

describe('Channel Data Functions', () => {
  describe('Offset Function', () => {
    it ('Does nothing with 0 offset', () => {
      let result = cd.offset(data, 0);
      assert.deepEqual(ftoi(data), ftoi(result));
    });

    it ('Offsets with zeros', () => {
      // Offset 1 with 1 sample rate
      let result = cd.offset(data, 10, 1);

      assert.deepEqual(ftoi(result),
        ftoi([
          _.concat(_.fill(Array(10), 0),data[0]),
          _.concat(_.fill(Array(10), 0),data[1])
        ]));
    });

    it ('Offsets with zeros based on sample rate', () => {
      // Offset 1 with 2 sample rate
      let result = cd.offset(data, 5, 2);

      assert.deepEqual(ftoi(result),
        ftoi([
          _.concat(_.fill(Array(10), 0),data[0]),
          _.concat(_.fill(Array(10), 0),data[1])
        ]));
    });


  });

  describe('Resample Function', () => {
    it('samples to a higher rate', () => {
      let result = cd.resample(data, 1, 2);

      assert.deepEqual(ftoi(result),
        ftoi([
          [0, 0, 25, 25, 5, 5, 75, 75, 8, 8],
          [5, 5 , 5, 5 , 5, 5, 5 , 5, 5 , 5],
        ]));
    })
  });
})
