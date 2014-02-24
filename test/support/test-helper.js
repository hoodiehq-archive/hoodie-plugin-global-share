var sinon = require('sinon');
var hoodie_server = require('hoodie-server');
var path = require('path');

//
// npm link
// npm link plugin-name
// start server with custom index.html that loads hoodie.js incl. global-share plugin
// run casper tests
// npm unlink
// npm unlink plugin-name
//

module.exports = {
  before: (function () {

    before(function (done) {
      this.server_config = {
        www_port: 5011,
        admin_port: 5021,
        admin_password: '12345',
        www_root: path.resolve('test/support/www')
      };
      this.server = hoodie_server.start(this.server_config, function () {
        return done();
      });

    });

  }()),
  beforeEach: (function () {

    beforeEach(function () {
      this.sandbox = sinon.sandbox.create();
    });

  }()),
  afterEach: (function () {

    afterEach(function () {
      this.sandbox.restore();
    });

  }()),
  after: (function () {

    after(function () {});

  }())

};

