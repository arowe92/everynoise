const colour = require('colour');
const prettyjson = require('prettyjson');

colour.setTheme({
  info: 'green',
  warn: ['yellow'],
  error: 'red bold',
  debug: 'green bold',
  number: 'blue',
});

const LEVEL = {
  error: 1,
  warn: 2,
  info: 3,
  debug: 3,
  all: Infinity,
  white: Infinity,
  none: - Infinity,
}

let _level = LEVEL.all;

const _log = function (color='white') {
  // Exit early
  if (LEVEL[color] && LEVEL[color] > _level) return;

  let args = [];
  for (let i in arguments) {
    if (i == 0) continue

    // String coloring
    if (typeof arguments[i] === 'string') {
      args[i - 1] = arguments[i][color];
    }

    // Object rendering
    else if (typeof arguments[i] === 'object') {
      args[i - 1] = prettyjson.render(JSON.parse(JSON.stringify(arguments[i])));
    }

    // Number Coloring
    else if (typeof arguments[i] === 'number') {
      args[i - 1] = ('' + arguments[i]).number;
    }
  }

  console.log.apply(this, args);
}

const log = _log.bind(_log, 'white');

// log methods
log.info = _log.bind(_log, 'info');
log.debug = _log.bind(_log, 'debug');
log.warn = _log.bind(_log, 'warn');
log.warning = log.warn;
log.error = _log.bind(_log, 'error');
log.err = log.error;

// Log Setting Methods
log.setLevel = level => _level = LEVEL[level];
log.enableAll = log.setLevel.bind(_log, 'all');
log.disableAll = log.setLevel.bind(_log, 'none');

// Level Object ENUM
log.LEVEL = LEVEL;

module.exports = log;
