var async = require('async'),
    util = require('util'),
    _ = require('lodash');


module.exports = function (hoodie, callback) {

    'use strict';

    var plugin_name = 'hoodie-plugin-global-share';
    var dbname = plugin_name;

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

    // TODO: if user doc does not have global-share replcation
    // property and is confirmed, set up replication and add it

    // this should be done on user change (after signup), but also
    // on server startup in case the plugin has been installed but
    // replication is not set up for existing users

    // also, install filter ddoc in *source* (user db) so only docs
    // marked public are replicated

    function setupReplication(user) {
        console.log(['setupReplication', user]);
        // TODO: [Sun, 09 Feb 2014 13:54:58 GMT] [error] [<0.107.0>] Replication manager, error processing document `b17b0bbf9cb017858fe64e2e26000aa9`: Could not open source database `user/9e1zhit`: {unauthorized,<<"user/9e1zhit">>}
        var doc = {
            source: user.database,
            target: dbname,
            filter: 'filter_global-share-public-docs/publicDocs',
            continuous: true,
            user_ctx: user
        };
        function reportError(err) {
            console.error('Error setting up replication with public share');
            console.error(util.inspect(doc));
            console.error(err);
        }
        var filter_ddoc = {
            _id: '_design/filter_global-share-public-docs',
            filters: {
                publicDocs: (function (doc, req) {
                    return !!(doc.$public);
                }).toString()
            }
        };
        console.log('about to post filter ddoc');
        var dburl = '/' + encodeURIComponent(user.database);
        hoodie.request('POST', dburl, {data: filter_ddoc},
            function (err, res) {
                if (err) {
                    return reportError(err);
                }
                console.log('about to post to replicator');
                hoodie.request('POST', '/_replicator', {data: doc},
                    function (err, res) {
                        if (err) {
                            return reportError(err);
                        }
                        hoodie.account.update(user.type, user.id, {
                            globalShareReplication: res.id
                        },
                        function (err) {
                            if (err) {
                                return reportError(err);
                            }
                            console.log(
                                'Setup public share replication for ' +
                                user.database
                            );
                        })
                    }
                );
            }
        );
    }

    hoodie.account.on('user:change', function (doc) {
        console.log(['global-share got user change event', doc]);
        var isConfirmed = _.contains(doc.roles, 'confirmed');
        if (isConfirmed && doc.database && !doc.globalShareReplication) {
            setupReplication(doc);
        }
    });

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
