var expect = require('expect.js');
var request = require('request');

describe('starts default hoodie server', function () {

  describe('should provide the plugins database', function () {

    var dbreq = {};

    before(function (done) {

      request.get({
        uri: 'http://127.0.0.1:' + this.server_config.www_port + '/_api/hoodie-plugin-global-share',
        method: 'GET',
        json: true
      }, function (err, resp, body) {
        dbreq.resp = resp;
        dbreq.body = body;
        done();
      });

    });

    it('should serves a hoodie-plugin-global-share', function () {
      expect(dbreq.body.db_name).to.equal('hoodie-plugin-global-share');
    });

    it('should pass through CouchDB headers', function () {
      expect(dbreq.resp.headers.server.match('CouchDB')).to.be.ok();
    });

    it('should response with a status code of 200', function () {
      expect(dbreq.resp.statusCode).to.eql(200);
    });

  });


  it('should serve the servers default index.html', function (done) {

    request.get({
      uri: 'http://127.0.0.1:' + this.server_config.www_port + '/',
      method: 'GET'
    }, function (err, resp, body) {
      expect(body).to.equal('hi\n');
      done();
    });

  });


  it('should serve hoodie.js containing the FE part of this plugin', function (done) {

    request.get({
      uri: 'http://127.0.0.1:' + this.server_config.www_port + '/_api/_files/hoodie.js',
      method: 'GET'
    }, function (err, resp, body) {
      expect(body.match('hoodie-plugin-global-share')).to.be.ok();
      done();
    });

  });

});

