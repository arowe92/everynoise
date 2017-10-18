let path = require('path')
let fs = require('fs');

// List all files in a directory in Node.js recursively in a synchronous fashion
function walkSync(dir, ext, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), ext, filelist);
    }
    else {
      if (ext && ext != path.extname(file).toLowerCase()) return;
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
}

module.exports = {
  walkSync
};
