/*global Hoodie:true*/

Hoodie.extend(function (hoodie) {

  'use strict';

  hoodie.global = hoodie.open('hoodie-plugin-global-share');
  hoodie.global.connect();

  hoodie.store.on('add', function (doc) {
    if (doc.$public) {
      return hoodie.global.add(doc.type, doc);
    }
  });

  hoodie.store.on('update', function (type, id, doc) {
    if (doc.$public) {
      return hoodie.global.update(type, id, doc);
    }
  });

  hoodie.store.on('remove', function (doc) {
    if (doc.$public) {
      return hoodie.global.remove(doc.type, doc._id);
    }
  });

  return hoodie;

});
