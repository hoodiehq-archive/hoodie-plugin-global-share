/*global Hoodie:true*/

Hoodie.extend(function (hoodie) {

  'use strict';

  hoodie.global = hoodie.open('hoodie-plugin-global-share');
  hoodie.global.connect();

  hoodie.store.on('add', function (doc) {
    if (doc.$public) {
      hoodie.global.add(doc.type, doc).done(function (newObject) {
        console.log('added: ', newObject);
      });
    }
  });

  hoodie.store.on('update', function (type, id, doc) {
    if (doc.$public) {
      hoodie.global.update(type, id, doc).done(function (updatedObject) {
        console.log('updated: ', updatedObject);
      });
    }
  });

  hoodie.store.on('remove', function (doc) {
    hoodie.global.remove(doc.type, doc._id).done(function (removedObject) {
        console.log('removed: ', removedObject);
    });
  });

  return hoodie;

});
