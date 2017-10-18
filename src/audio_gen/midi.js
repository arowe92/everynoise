let fs = require('fs');
let MidiFileParser = require('midi-file-parser');

// Load a MIDI file into JSON
function loadMidiFile(fileName, samples) {
  // Load if samples is a json file
  if (typeof samples == 'string') {
    samples = JSON.parse(fs.readFileSync(samples, 'utf-8'));
  }

  let file = fs.readFileSync(fileName, 'binary');
  let midi = MidiFileParser(file);

  let events = [];
  let ticksPerBeat = midi.header.ticksPerBeat;

  // default 120 BPM
  let secPerBeat = 0.5;

  // Find tempo
  for (let event of midi.tracks[0]) {
    if (event.subtype == 'setTempo') {
      secPerBeat = event.microsecondsPerBeat * Math.pow(10, -6);
      break;
    }
  }

  // Find BPM and seconds per tick
  const bpm = 60 / secPerBeat;
  const secPerTick = secPerBeat / ticksPerBeat;

  // keep track of current tick
  let tick = 0;

  for (let event of midi.tracks[1]) {
    // Keep status of song
    tick += event.deltaTime;

    // We only want noteOne events
    if (event.subtype != 'noteOn') continue;
    if (!samples[event.noteNumber]) continue;

    events.push({
      sample: samples[event.noteNumber],
      volume: event.velocity / 127,
      offset: tick * secPerTick,
      pan: 0.5,
    });
  }

  return {
    duration: tick * secPerTick,
    bpm,
    events,
    samples
  }
}

module.exports = {
  loadMidiFile,
};
