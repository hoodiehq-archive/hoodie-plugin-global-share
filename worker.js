var async = require('async');


module.exports = function (hoodie, cb) {

    'use strict';

    var dbname = 'hoodie-plugin-global-share';

    var permission_check = function (newDoc, oldDoc, userCtx) {
        if (!userCtx.name) {
            throw {unauthorized: 'You must have an authenticated session'};
        }
        if (oldDoc) {
            if (newDoc._deleted) {
                // delete
                if (userCtx.name !== oldDoc.createdBy) {
                    throw {unauthorized: 'Only creator can delete this'};
                }
            }
            else {
                // edit
                if (userCtx.name !== oldDoc.createdBy) {
                    throw {unauthorized: 'Only creator can edit this'};
                }
            }
        }
        else {
            // create
            if (userCtx.name !== newDoc.createdBy) {
                throw {unauthorized: 'createdBy must match your username'};
            }
        }
    };

    async.series([
        async.apply(hoodie.database.add, dbname),
        async.apply(hoodie.database(dbname).addPermission,
            'global-share-per-user-writes',
            permission_check
        ),
        async.apply(hoodie.database(dbname).grantPublicWriteAccess)
    ],
    callback);

};
