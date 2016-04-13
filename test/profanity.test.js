/*
Copyright (C) 2014 Kano Computing Ltd.
License: http://opensource.org/licenses/MIT The MIT License (MIT)
*/

var should = require('should'),
    util = require('./util'),
    profanity = require('../lib/profanity'),
    _ = require('underscore');

function callTestCheckFunctions(languages, forbiddenList) {
  it('Should return null with no swearwords found in string', function () {
      should(profanity.check('No swearwords here', languages, forbiddenList)).eql([]);
  });

  it('Should return array of swearwords found in dirty string', function () {
      var results = profanity.check('something damn something something poo something', languages, forbiddenList);

      should(results).eql([
          'damn',
          'poo'
      ]);
  });

  it('Should not target substrings', function () {
      var detected = profanity.check('foo ass bar', languages, forbiddenList),
          notDetected = profanity.check('foo grass bar', languages, forbiddenList);

      should(detected).have.length(1);
      should(notDetected).have.length(0);
  });

  it('Should work equally for objects (Recursively) and arrays', function () {
      var results_obj = profanity.check({
              foo: 'something damn',
              bar: { test: 'something poo', bar: 'crap woooh' }
          }, languages, forbiddenList),
          results_arr = profanity.check([
              'something damn',
              [ 'something poo' ],
              { foo: [ { bar: 'something crap' } ] }
          ], languages, forbiddenList);

      should(results_obj).eql([
          'damn',
          'poo',
          'crap'
      ]);

      should(results_arr).eql([
          'damn',
          'poo',
          'crap'
      ]);
  });
}

describe('Profanity module', function () {
    describe('.check(target)', function () {
       callTestCheckFunctions();
    });
    
    describe('.check(target) when languages="all"', function () {
       callTestCheckFunctions('all', null);
    });
    
    describe('.check(target) for portuguese', function () {
      it('Should not get a portuguese dirty word when there is no language specifided (default is english)', function () {
          var notDetected = profanity.check('viados não gostam de pepeca', null);

          should(notDetected).have.length(0);
      });
      
      it('Should get a dirty word and not get substrings', function () {
          var detected = profanity.check('viado não gosta de pepeca', 'pt');
          var notDetected = profanity.check('viados não gosta de pepecas', 'pt');

          detected.should.eql(['viado', 'pepeca']);
          notDetected.should.eql([]);
      });
      
      it('Should work equally for objects (Recursively) and arrays', function () {
        var results_obj = profanity.check({ foo: 'something perereca', bar: { test: 'something punheta', bar: 'paspalhão woooh' } }, 'pt'),
        results_arr = profanity.check(['something porra', [ 'something precheca' ], { foo: [ { bar: 'something puta' } ] }], 'pt');

        should(results_obj).eql([
            'perereca',
            'punheta',
            'paspalhão'
        ]);

        should(results_arr).eql([
            'porra',
            'precheca',
            'puta'
        ]);
      });
    });
    
    describe('.check(target) for multiple languages', function () {
      it('Should get a dirty word and not get substrings', function () {
          var detected = profanity.check('viado não gosta de pepeca fucker bocchinara reudig', ['pt', 'it', 'de', 'en']);
          var notDetected = profanity.check('viados não gosta de pepecas fuckersras, bocchinarasws reudigs', ['pt', 'it', 'de', 'en']);

          detected.should.eql(['viado', 'pepeca', 'fucker', 'bocchinara', 'reudig']);
          notDetected.should.eql([]);
      });
      
      it('Should work equally for objects (Recursively) and arrays', function () {
        var results_obj = profanity.check({ foo: 'something perereca fucker  ', bar: { test: 'something punheta bocchinara', bar: 'paspalhão reudig woooh' } }, ['pt', 'it', 'de', 'en']),
        results_arr = profanity.check(['something porra fucker', [ 'something precheca bocchinara ' ], { foo: [ { bar: 'something puta reudig' } ] }], 'all');

        should(results_obj).eql([
            'perereca',
            'fucker',
            'punheta',
            'bocchinara',
            'paspalhão',
            'reudig'
        ]);

        should(results_arr).eql([
            'porra',
            'fucker',
            'precheca',
            'bocchinara',
            'puta',
            'reudig'
        ]);
      });
    });
    
    describe('.checkAsync(target)', () => {
      it('Should return null with no swearwords found in string', (done) => {
        profanity.checkAsync('No swearwords here')
          .then(results => {
            should(results).eql([]);
            done();
          });
      });

      it('Should return array of swearwords found in dirty string', (done) => {
          profanity.checkAsync('something damn something something poo something')
            .then(results => {
              should(results).eql([
                'damn',
                'poo'
              ]);
              
              done();
            })
            .catch(err => {
              console.log(err);
            });
      });
      
      it('Should work when passing my own forbidden list', (done) => {
          profanity.checkAsync('something damn something something poo something', 'en', ['damn', 'poo'])
            .then(results => {
              should(results).eql([
                'damn',
                'poo'
              ]);
              
              done();
          });
      });

      it('Should not target substrings', function () {
        Promise.all([profanity.checkAsync('foo ass bar'), profanity.checkAsync('foo grass bar')])
          .then( results => {
            var detected = results[0];
            var notDetected = results[1];
            
            detected.should.have.length(1);
            notDetected.should.have.length(0);
          });
      });

      it('Should work equally for objects (Recursively) and arrays', function () {
        var firstTarget = { foo: 'something damn', bar: { test: 'something poo', bar: 'crap woooh' } };
        var secondTarget = { foo: 'something damn', bar: { test: 'something poo', bar: 'crap woooh' } };
        var thirdTarget = ['something damn', [ 'something poo' ], { foo: [ { bar: 'something crap' } ] }];
        Promise.all([profanity.checkAsync(firstTarget), profanity.checkAsync(secondTarget), profanity.checkAsync(thirdTarget)])
          .then(results => {
            results.should.have.length(3);
            _.each(results, result => {
              result.should.eql(['damn','poo','crap']);
            });
          });
      });
      
      it('Should jump to catch when passing language that is not supported by the tool', () => {
        profanity.checkAsync('Anything', ['HUE'])
          .catch(err => {
            err.code.should.eql('ENOENT');
          });
      });
    });
    
    
    describe('.purify(target)', function () {
      it('Should work in obscure (default) mode on a simple string', function () {
        var result = profanity.purify('boob damn something poo');

        result[0].should.equal('b**b d**n something p*o');
        result[1].should.eql([ 'boob', 'damn', 'poo' ]);
      });
      
      it('Should work when passing my own forbidden list', function () {
        var result = profanity.purify('boob damn something pota', { forbiddenList: ['boob', 'damn', 'pota'] });

        result[0].should.equal('b**b d**n something p**a');
        result[1].should.eql([ 'boob', 'damn', 'pota' ]);
      });

      it('Should work in obscure (default) mode recursively with objects, with infinite recursion and maxRecursionDepth', function () {
        var testObj = {
            bar: { foo: 'something boob', bar: { foo: 'test poo', bler: {foo: 'will not enter here'} } },
            test: 'something damn'
        };
        testObj.crazy = testObj;
        
        var result = profanity.purify(testObj, {maxRecursionDepth: 1});

        result[0].should.have.keys('bar', 'test', 'crazy');
        result[0].bar.should.have.keys('foo', 'bar');
        result[0].bar.foo.should.equal('something b**b');
        result[0].bar.bar.should.have.keys('foo', 'bler');
        result[0].bar.bar.foo.should.equal('test p*o');
        result[0].bar.foo.should.equal('something b**b');
        result[0].test.should.equal('something d**n');

        result[1].should.eql([ 'boob', 'poo', 'damn' ]);
      });

      it('Should work in replace mode on a simple string', function () {
        var result = profanity.purify('boob damn something poo', {
            replace: true
        });

        util.testPurified(result[0], '[ placeholder ] [ placeholder ] something [ placeholder ]');
        result[1].should.eql([ 'boob', 'damn', 'poo' ]);
      });

      it('Should work in replace mode recursively with objects', function () {
        var result = profanity.purify({
            bar: { foo: 'something boob', bar: { foo: 'test poo' } },
            test: 'something damn'
        }, {
            replace: true
        });

        result[0].should.have.keys('bar', 'test');
        result[0].bar.should.have.keys('foo', 'bar');
        util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
        result[0].bar.bar.should.have.keys('foo');
        util.testPurified(result[0].bar.bar.foo, 'test [ placeholder ]');
        util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
        util.testPurified(result[0].test, 'something [ placeholder ]');

        result[1].should.eql([ 'boob', 'poo', 'damn' ]);
      });
    });
    
    describe('.purifyAsync(target)', function () {
        it('Should work in obscure (default) mode on a simple string', function () {
            profanity.purifyAsync('boob damn something poo')
              .then(result => {
                result[0].should.equal('b**b d**n something p*o');
                result[1].should.eql([ 'boob', 'damn', 'poo' ]);
              });
        });

        it('Should work in obscure (default) mode recursively with objects', function () {
          var objToCheck = {
            bar: { foo: 'something boob', bar: { foo: 'test poo' } },
            test: 'something damn'
          };
          profanity.purifyAsync(objToCheck)
            .then(result => {
              result[0].should.have.keys('bar', 'test');
              result[0].bar.should.have.keys('foo', 'bar');
              result[0].bar.foo.should.equal('something b**b');
              result[0].bar.bar.should.have.keys('foo');
              result[0].bar.bar.foo.should.equal('test p*o');
              result[0].bar.foo.should.equal('something b**b');
              result[0].test.should.equal('something d**n');

              result[1].should.eql([ 'boob', 'poo', 'damn' ]);
            });
        });

        it('Should work in replace mode on a simple string', function () {
          profanity.purifyAsync('boob damn something poo', { replace: true })
            .then(result => {
              util.testPurified(result[0], '[ placeholder ] [ placeholder ] something [ placeholder ]');
              result[1].should.eql([ 'boob', 'damn', 'poo' ]);
            });
        });

        it('Should work in replace mode recursively with objects', function () {
          var objToCheck = {
            bar: { foo: 'something boob', bar: { foo: 'test poo' } },
            test: 'something damn'
          };
          profanity.purifyAsync(objToCheck, { replace: true })
            .then(result => {
              result[0].should.have.keys('bar', 'test');
              result[0].bar.should.have.keys('foo', 'bar');
              util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
              result[0].bar.bar.should.have.keys('foo');
              util.testPurified(result[0].bar.bar.foo, 'test [ placeholder ]');
              util.testPurified(result[0].bar.foo, 'something [ placeholder ]');
              util.testPurified(result[0].test, 'something [ placeholder ]');

              result[1].should.eql([ 'boob', 'poo', 'damn' ]);
            });
        });
        
        it('Should jump to catch when passing language that is not supported by the tool', () => {
        profanity.purifyAsync('Anything', { languages: ['HUE'] })
          .catch(err => {
            err.code.should.eql('ENOENT');
          });
      });
    });
});
