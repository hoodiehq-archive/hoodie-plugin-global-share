/*global Hoodie, $*/

Hoodie.extend(function (hoodie) {

  'use strict';

  hoodie.global = hoodie.open('hoodie-plugin-global-share');
  hoodie.global.connect();


  // hoodie.store decorations
    // --------------------------

    // hoodie.store decorations add custom methods to promises returned
    // by hoodie.store methods like find, add or update. All methods return
    // methods again that will be executed in the scope of the promise, but
    // with access to the current hoodie instance

    // ### publish

    // publish an object. If an array of properties passed, publish only these
    // attributes and hide the remaining ones. If no properties passed, publish
    // the entire object.
    //
    function storePublish() {
      return togglePublish(this, true);
    }


    // ### unpublish

    //
    function storeUnpublish() {
      return togglePublish(this, false);
    }

    // helpers

    function togglePublish (promise, isPublic) {
      return promise.then(function(objects) {
        if (!$.isArray(objects)) {
          objects = [objects];
        }

        return hoodie.store.updateAll(objects, {$public: isPublic});
      });
    }

    hoodie.store.decoratePromises({
      publish: storePublish,
      unpublish: storeUnpublish
    });

});
