/*
Copyright (C) 2014 Kano Computing Ltd.
License: http://opensource.org/licenses/MIT The MIT License (MIT)
*/

var _ = require('underscore');
var fs = require('fs');
var Promise = require('bluebird');
var readFile = Promise.promisify(fs.readFile);

function eachRecursive (obj, fn, maxDepth, depth, checked) {
  checked = checked || [];

  depth = depth || 0;
  if ((maxDepth && depth > maxDepth) || obj in checked) {
    return;
  }

  _.each(obj, function (val, key) {
    checked.push(obj);

    if (_.isObject(val)) {
      for (var i in checked) {
        if (val == checked[i]) {
          return;
        }
      }

      checked.push(val);

      depth += 1;
      eachRecursive(val, fn, maxDepth, depth, checked);
    } else {
      fn(val, key, obj, depth);
    }
  });
}

function promisiFyReadJsonFile(fileName, options) {
  return readFile(fileName, options)
    .then(data => {
      return JSON.parse(data);
    }); 
}

module.exports = {
    eachRecursive: eachRecursive,
    promisiFyReadJsonFile: promisiFyReadJsonFile
};
