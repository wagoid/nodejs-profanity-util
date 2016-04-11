/*
Copyright (C) 2014 Kano Computing Ltd.
License: http://opensource.org/licenses/MIT The MIT License (MIT)
*/

var util = require('./util');
var fs = require('fs');
var _ = require('underscore');
var path = require('path');

var DEFAULT_REPLACEMENTS = [
  'bunnies',
  'butterfly',
  'kitten',
  'love',
  'gingerly',
  'flowers',
  'puppy',
  'joyful',
  'rainbows',
  'unicorn'
];
var DEFAULT_LANGUAGES = ['en'];
var AVAILABLE_LANGUAGES = ['ar', 'cs', 'da', 'de', 'en', 'eo', 'es', 'fa', 'fi', 'fr', 'hi', 'hu', 'it', 'ja', 'ko', 'nl', 'no', 'pl', 'pt', 'ru', 'sv', 'th', 'tlh', 'tr', 'zh'];
var DEFAULT_FS_OPTIONS = {encoding: 'utf8' };
var SWEARWORDS_DIR = path.join(__dirname, 'swearwords');

function promisiFyReadFile(fileName, options) {
  return new Promise(function (resolve, reject) {
    fs.readFile(fileName, options, function (err, data) {
      if (err) {
        reject(err);
      } else {
        var jsonData = JSON.parse(data);
        resolve(jsonData);
      }
    });
  }); 
}

function getWordListsPromises (languages) {
  var promises = [];
  _.each(languages, function(language) {
    promises.push(promisiFyReadFile(path.join(SWEARWORDS_DIR, language + '.json'), DEFAULT_FS_OPTIONS));
  });
  return promises;
}

function getWordListsConcatenated (languages) {
  var lists = [];
  
  _.each(languages, function (language) {
    lists = lists.concat(JSON.parse(fs.readFileSync(path.join(SWEARWORDS_DIR, language + '.json'), DEFAULT_FS_OPTIONS)));
  });
  
  return lists;
}

function escapeRegexChars (word) {
  return word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function getListRegexAsync (list, languages) {
  if (list) {
    return Promise(function (resolve, reject) { resolve(_getListRegex(list)); } );
  } else {
    return new Promise(function (resolve, reject) {
      Promise.all(getWordListsPromises(languages))
      .then(function (listsArray) {
        var listRegex = [];
        _.each(listsArray, function (lst) {
          listRegex = listRegex.concat(_getListRegex(lst));
        });
        
        resolve(listRegex);
      })
      .catch(function (err) {
        reject(err);
      });
    });
  }
}

function getListRegex (list, languages) {
  if (!list) {
    list = getWordListsConcatenated(languages);
  }
  return _getListRegex(list);
}

function _getListRegex(list) {
  // we want to treat all characters in the word as literals, not as regex specials (e.g. shi+)
  // var escapedRegexChars = '';
  // _.each(list, function (langWords) {
  //   escapedRegexChars += langWords.map(escapeRegexChars);
  // });
  return new RegExp('\\b(' + list.map(escapeRegexChars).join('|') + ')\\b', 'gi');
}

function getDefaultLanguagesValue (languages) {
  if (util.isString(languages)) {
    if (languages.toLowerCase() === 'all') {
      languages = AVAILABLE_LANGUAGES;
    } else {
      languages = [languages];
    }
  } else if (!languages) {
    languages = DEFAULT_LANGUAGES;
  }
  
  return languages;
}

function check (target, languages, forbiddenList) {
  languages = getDefaultLanguagesValue(languages);

  var regex = forbiddenList ? getListRegex(forbiddenList, languages) : getListRegex(null, languages);

  return _check(target, regex);
}

function _check (target, regex) {
  var targets = [];
  
  if (util.isString(target)) {
    targets.push(target);
  } else if (typeof target === 'object') {
    util.eachRecursive(target, function(val) {
      if (util.isString(val)) {
        targets.push(val);
      }
    });
  }
  
  return targets.join(' ').match(regex) || [];
}

function checkAsync (target, languages, forbiddenList) {
  languages = getDefaultLanguagesValue(languages);
  
  return new Promise(function(resolve, reject) {
    getListRegexAsync(forbiddenList, languages)
      .then(function (regex) {
        var result = _check(target, regex);
        resolve(result);
      })
      .catch(function (err) {
        reject(err);
      });
  });
}

function purifyString (str, regex, options) {
  options = options || {};

  var matches = [],
    purified,
    replacementsList = options.replacementsList || DEFAULT_REPLACEMENTS,
    replace = options.replace || false,
    obscureSymbol = options.obscureSymbol || '*';

  purified = str.replace(regex, function(val) {
    matches.push(val);

    if (replace) {
      return replacementsList[Math.floor(Math.random() * replacementsList.length)];
    }

    var str = val.substr(0, 1);

    for (var i = 0; i < val.length - 2; i += 1) {
      str += obscureSymbol;
    }

    return str + val.substr(-1);
  });

  return [purified, matches];
}

function purify (target, options) {
  options = options || {};
  options.languages = getDefaultLanguagesValue(options.languages);

  var matches = [],
    fields = options.fields || (target instanceof Object ? Object.keys(target) : []),
    result, regex = options.forbiddenList ? getListRegex(forbiddenList, options.languages) : getListRegex(null, options.languages);

  if (typeof target === 'string') {

    return purifyString(target, regex, options);

  } else if (typeof target === 'object') {
    fields.forEach(function(field) {

      // TODO: Use better recursive checking, make DRYer
      if (typeof target[field] === 'string') {

        result = purifyString(target[field], regex, options);
        target[field] = result[0];
        matches = matches.concat(result[1]);

      } else if (typeof target[field] === 'object') {
        util.eachRecursive(target[field], function(val, key, root) {
          if (typeof val === 'string') {
            result = purifyString(val, regex, options);
            root[key] = result[0];
            matches = matches.concat(result[1]);
          }

        });
      }
    });

    return [target, matches];
  }
}

module.exports = {
  check: check,
  checkAsync: checkAsync,
  purify: purify
};