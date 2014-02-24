/*global casper:false */

'use strict';

casper.test.comment('check hosts');

casper.on('remote.message', function (msg) {
  console.log('remote message', msg);
});

casper.start(casper.cli.get('HOSTNAME'), function (resp) {

  this.test.info('Current location is ' + this.getCurrentUrl());
  this.test.assert(resp.status === 200);

  this.evaluate(function () {
    this.test.info('hoodie.js loaded and instanciated');
    this.test.assert(hoodie instanceof Object);
    require('utils').dump(hoodie);
  });

});


casper.thenOpen(casper.cli.get('HOSTNAME') + '/', function (resp) {
  this.test.info('Current location is ' + this.getCurrentUrl());
  this.test.assert(resp.status === 200);
});

casper.run(function () {
  this.test.done();
});

