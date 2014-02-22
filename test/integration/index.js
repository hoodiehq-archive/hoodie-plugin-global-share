require('expect.js');

//
// npm link
// npm link plugin-name
// start server with custom index.html that loads hoodie.js incl. global-share plugin
// npm unlink
// npm unlink plugin-name
//

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

describe('server', function () {

  it('should start a hoodie instance', function (done) {

    start_server(function () {
      done();
    });
  });

});

