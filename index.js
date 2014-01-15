module.exports = function (hoodie, cb) {

  'use strict';

  var internals = {
    db: {
      'name': 'hoodie-plugin-global-share'
    }
  };

  var db = hoodie.database(internals.db.name);

  hoodie.database.add(internals.db.name, function (err, db) {

    if (err && err.error === 'file_exists') {
      return cb();
    }

    if (err) {
      return cb(err);
    }

  });

};
