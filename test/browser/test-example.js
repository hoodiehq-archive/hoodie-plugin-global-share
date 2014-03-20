suite('Browser API', function () {

  setup(function (done) {
    // phantomjs seems to keep session data between runs,
    // so clear before running tests
    localStorage.clear();
    hoodie.account.signOut().done(function () {
      done();
    });
  });

  test('hoodie.global exists', function () {
    assert.ok(hoodie.global);
  });

});
