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

  it('Should retur array of swearwords found in dirty string', function () {
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

  it('Should work equally for objects (Recursively) and arrays', function (done) {
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

      done();
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
      
      it('Should work equally for objects (Recursively) and arrays', function (done) {
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

        done();
      });
    });
    
    describe('.check(target) for multiple languages', function () {
      it('Should get a dirty word and not get substrings', function () {
          var detected = profanity.check('viado não gosta de pepeca fucker bocchinara reudig', ['pt', 'it', 'de', 'en']);
          var notDetected = profanity.check('viados não gosta de pepecas fuckersras, bocchinarasws reudigs', ['pt', 'it', 'de', 'en']);

          detected.should.eql(['viado', 'pepeca', 'fucker', 'bocchinara', 'reudig']);
          notDetected.should.eql([]);
      });
      
      it('Should work equally for objects (Recursively) and arrays', function (done) {
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

        done();
      });
    });
    
    describe('.checkAsync(target)', () => {
      it('Returns null with no swearwords found in string', () => {
        profanity.checkAsync('No swearwords here')
          .then(results => {
          should(results).eql([]);
        });
      });

      it('Returns array of swearwords found in dirty string', () => {
          profanity.checkAsync('something damn something something poo something')
            .then(results => {
              should(results).eql([
                'damn',
                'poo'
              ]);
          });
      });

      it('Doesn\'t target substrings', function () {
        Promise.all([profanity.checkAsync('foo ass bar'), profanity.checkAsync('foo grass bar')])
          .then( results => {
            var detected = results[0];
            var notDetected = results[1];
            
            detected.should.have.length(1);
            notDetected.should.have.length(0);
          });
      });

      it('Works equally for objects (Recursively) and arrays', function () {
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
    });
    
    
    describe('.purify(target)', function () {

        it('works in obscure (default) mode on a simple string', function () {
            var result = profanity.purify('boob damn something poo');

            result[0].should.equal('b**b d**n something p*o');
            result[1].should.eql([ 'boob', 'damn', 'poo' ]);
        });

        it('works in obscure (default) mode recursively with objects', function (done) {
            var result = profanity.purify({
                bar: { foo: 'something boob', bar: { foo: 'test poo' } },
                test: 'something damn'
            });

            result[0].should.have.keys('bar', 'test');
            result[0].bar.should.have.keys('foo', 'bar');
            result[0].bar.foo.should.equal('something b**b');
            result[0].bar.bar.should.have.keys('foo');
            result[0].bar.bar.foo.should.equal('test p*o');
            result[0].bar.foo.should.equal('something b**b');
            result[0].test.should.equal('something d**n');

            result[1].should.eql([ 'boob', 'poo', 'damn' ]);

            done();
        });

        it('works in replace mode on a simple string', function (done) {
            var result = profanity.purify('boob damn something poo', {
                replace: true
            });

            util.testPurified(result[0], '[ placeholder ] [ placeholder ] something [ placeholder ]');
            result[1].should.eql([ 'boob', 'damn', 'poo' ]);


            done();
        });

        it('works in replace mode recursively with objects', function (done) {
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

            done();
        });

    });
});
