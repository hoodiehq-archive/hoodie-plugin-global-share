var sinon = require('sinon');

module.exports = {
  before: (function () {

    before(function () { });

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
