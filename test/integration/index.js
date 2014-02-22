require('expect.js');

var hoodie_server = require('hoodie-server');

var config = {
  www_port: 5011,
  admin_port: 5021,
  admin_password: '12345'
};

var hasServer = false;

function start_server(callback) {

  if (hasServer) {
    return callback();
  }

  hoodie_server.start(config, function () {
    hasServer = true;
    return callback();
  });
}

describe('http api', function () {

  it('should send index.html on accept: text/html', function (done) {

    start_server(function () {
      done();
    });
  });

});

