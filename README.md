# Node.js Profanity Utility

[![Build Status](https://travis-ci.org/wagoid/nodejs-profanity-util.svg?branch=master)](https://travis-ci.org/wagoid/nodejs-profanity-util)
[![Coverage Status](https://coveralls.io/repos/github/wagoid/nodejs-profanity-util/badge.svg?branch=master)](https://coveralls.io/github/wagoid/nodejs-profanity-util?branch=master)

> Utility for detection, filtering and replacement / obscuration of forbidden words

The original lists of swearwords used by default were taken from [here](https://gist.github.com/jamiew/1112488) and [here](https://github.com/shutterstock/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words).

**Please note:** This small utility module is written to prevent or monitor the use of certain words in your content without keeping context in account. An improper use may compromise the meaning of your content. Keep in account when using.

## Install

`npm install profanity-util`

## API

### `profanity.check(target_string, [languages], [ forbidden_list ])` 
#####async version is also available: `profanity.checkAsync(target_string, [languages], [ forbidden_list ])`

Returns a list of forbidden words found in a string.

**Arguments**

* `target_string` - String to search
* `languages`  (Optional )- Array of languages  to check words from. Accepts a string if just one language is needed. 
* `forbidden_list` (Optional) - Array containing forbidden terms

**Example**

```javascript
var profanity = require('profanity-util');

console.log(profanity.check('Lorem ipsum foo bar poop test poop damn dolor sit..'));
// [ 'poop', 'poop', 'damn' ]
```

Or the async method:

```javascript
var profanity = require('profanity-util');

profanity.checkAsync('Lorem ipsum foo bar poop test poop damn dolor sit..')
  .then(function (result) {
    console.log(result);
    // [ 'poop', 'poop', 'damn' ]
  })
  .catch(function (err) {
    console.log('Something went wrong.");
  });
```


### `profanity.purify(target, [ options ])`
#####async version is also available: `profanity.purifyAsync(target, [ options ])`

Purifies a string or strings contained in a given object or array from forbidden words.

If an object is given as target, this method will recursively loop through its values and purify every string.

By default forbidden swearwords will be obscured in this format: `a***b`, although setting `replace` option to `true` will activate replacement mode, which replaces each forbidden word with a random entry from a small list of inoffensive words (See `DEFAULT_REPLACEMENTS` in `lib/profanity.js`). This mode could be a fun and different approach to discourage and prevent swearing on your platform / app.

The .purify method will return an Array containing two values:

1. The purified String / Object / Array
2. An Array containing all swearwords obscured / replaced

**Arguments**

* `target` - Object, Array or String to purify
* `options` (Optional) - Purification options (Explained below)

**Options**

* `forbiddenList` - Array of forbidden terms to replace or obscure
* `languages` - Array of languages  to check words from. Accepts a string if just one language is needed. 
* `replacementsList` - Array of replacement words (To pick randomly from)
* `obscureSymbol` - Symbol used to obscure words if `obscured` is set to true
* `replace`- If set to true it will replace forbidden words (E.g. a*****b) instead of obscuring them
* `maxRecursionDepth` - If you are passing objects, a recursive iteration will be performed to fiind all strings inside it. You can set the maximum depth of the recursion.

**Examples**

**Obscure mode (default)**

```javascript
var profanity = require('profanity-util');

console.log(profanity.purify('lorem ipsum foo damn bar poop'));
// [ 'lorem ipsum foo d**n bar p**p, [ 'damn', 'poop' ] ]

console.log(profanity.purify({
	foo: 'poop',
	bar: { nested: 'damn', arr: [ 'foo', 'poop' ] }
}));
// [ { foo: 'p**p', bar: { nested: 'd**n', arr: [ 'foo', 'p**p' ] } }, [ 'poop', 'damn', 'poop' ] ]
```

Async version:

```javascript
var profanity = require('profanity-util');

profanity.purify('lorem ipsum foo damn bar poop')
  .then(function (result) {
    console.log(result);
    // [ 'lorem ipsum foo d**n bar p**p, [ 'damn', 'poop' ] ]
  })
  .catch(function (err) {
    console.log('Something went wrong.');
  });
```

**Obscure mode, custom options**

```javascript
var profanity = require('profanity-util');

console.log(profanity.purify('foo poop', { obscureSymbol: '$' }));
// [ 'foo p$$p', 'poop' ]

console.log(profanity.purify('foo poop', { forbiddenList: [ 'foo', 'bar' ] }));
// [ 'f*o poop', 'foo' ]
```

**Replace mode (`{ replace: true }`)**

```javascript
var profanity = require('profanity-util');

console.log(profanity-util.purify('lorem ipsum foo damn bar poop'));
// [ 'lorem ipsum foo gingerly bar rainbows', [ 'damn', 'poop' ] ]

console.log(profanity-util.purify({
	foo: 'poop',
	bar: { nested: 'damn', arr: [ 'foo', 'poop' ] }
}));
// [ { foo: 'kitten', bar: { nested: 'unicorn', arr: [ 'foo', 'puppy' ] } }, [ 'poop', 'damn', 'poop' ] ]
```

## Contribute

All contributions are welcome as long as tests are written.

## License

Copyright (c) 2014 Kano Computing Ltd. - Released under The MIT License.
