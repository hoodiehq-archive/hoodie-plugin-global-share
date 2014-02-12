var async = require('async'),
    util = require('util'),
    _ = require('lodash');


module.exports = function (hoodie, callback) {

    'use strict';

    var plugin_name = 'hoodie-plugin-global-share';
    var dbname = plugin_name;

    var permission_check = function (newDoc, oldDoc, userCtx) {
        function hasRole(x) {
            for (var i = 0; i < userCtx.roles.length; i++) {
                if (userCtx.roles[i] === x) {
                    return true;
                }
            }
            return false;
        }
        if (hasRole('_admin')) {
            // let admins remove docs etc, otherwise the unpublish
            // task would fail
            return;
        }
        if (!userCtx.name) {
            throw {unauthorized: 'You must have an authenticated session'};
        }
        if (oldDoc) {
            if (newDoc._deleted) {
                // delete
                if (!hasRole(oldDoc.createdBy)) {
                    throw {unauthorized: 'Only creator can delete this'};
                }
            }
            else {
                // edit
                if (!hasRole(oldDoc.createdBy)) {
                    throw {unauthorized: 'Only creator can edit this'};
                }
            }
        }
        else {
            // create
            if (!hasRole(newDoc.createdBy)) {
                throw {unauthorized: 'createdBy must match your username'};
            }
        }
    };

    // adds a filter for public === true on user db so we can do
    // filtered replication to global share db
    function setupPublicFilter(user, callback) {
        var filter_ddoc = {
            _id: '_design/filter_global-share-public-docs',
            filters: {
                publicDocs: (function (doc, req) {
                    return !!(doc.$public);
                }).toString()
            }
        };
        var dburl = '/' + encodeURIComponent(user.database);
        hoodie.request('POST', dburl, {data: filter_ddoc}, callback);
    }

    // sets up replication from user db to global share db
    function setupUserToPublic(user) {
        setupPublicFilter(user, function (err) {
            if (err) {
                console.error('Error setting up publicDocs filter for user');
                console.error(user);
                console.error(err);
                return;
            }
            var doc = {
                source: user.database,
                target: dbname,
                filter: 'filter_global-share-public-docs/publicDocs',
                continuous: true,
                user_ctx: {
                    name: user.name,
                    roles: user.roles
                }
            };
            hoodie.request('POST', '/_replicator', {data: doc},
                function (err, res) {
                    if (err) {
                        console.error(
                            'Error setting up replication to public db ' +
                            'for user'
                        );
                        console.error(user);
                        console.error(err);
                        return;
                    }
                    hoodie.account.update(user.type, user.id, {
                        globalShareReplicationOutgoing: res.id,
                        globalShares: true
                    },
                    function (err) {
                        if (err) {
                            console.error(
                                'Error setting globalShareReplicationOutgoing ' +
                                'property on user doc'
                            );
                            console.error(user);
                            console.error(err);
                            return;
                        }
                        console.log(
                            'Setup userdb->public replication for ' +
                            user.database
                        );
                    })
                }
            );
        });
    }

    // sets up replication from global share db to user db
    function setupPublicToUser(user) {
        var doc = {
            source: dbname,
            target: user.database,
            filter: 'filter_global-share-creator/excludeCreator',
            query_params: {name: user.id},
            continuous: true,
            user_ctx: {
                name: user.name,
                roles: user.roles
            }
        };
        hoodie.request('POST', '/_replicator', {data: doc},
            function (err, res) {
                if (err) {
                    console.error(
                        'Error setting up replication from public to user share'
                    );
                    console.error(user);
                    console.error(doc);
                    console.error(err);
                    return;
                }
                hoodie.account.update(user.type, user.id, {
                    globalShareReplicationIncoming: res.id,
                    globalShares: true
                },
                function (err) {
                    if (err) {
                        console.error(
                            'Error updating globalShareReplicationIncoming ' +
                            'property on user doc'
                        );
                        console.error(user);
                        console.error(err);
                        return;
                    }
                    console.log(
                        'Setup public->userdb replication for ' +
                        user.database
                    );
                })
            }
        );
    }

    // when a user doc changes, check if we need to setup replication for it
    function handleChange(doc) {
        if (_.contains(doc.roles, 'confirmed') && doc.database) {
            if (!doc.globalShares) {
                setupUserToPublic(doc);
                setupPublicToUser(doc);
            }
        }
    }

    // scan through all users in _users db and check if we need to
    // setup replication for them - unfortunately, we can't add a design
    // doc to the _users db to create a view for this!
    function catchUp(callback) {
        var url = '/_users/_all_docs';
        hoodie.request('GET', url, {}, function (err, body) {
            if (err) {
                return callback(err);
            }
            async.forEachSeries(body.rows, function (row, cb) {
                if (/_design/.test(row.id)) {
                    // skip design docs
                    return cb();
                }
                var docurl = '/_users/' + encodeURIComponent(row.id);
                hoodie.request('GET', docurl, {}, function (err, doc) {
                    if (err) {
                        return cb(err);
                    }
                    handleChange(doc);
                });
            },
            callback);
        });
    }

    // add filter to public share db stop your own docs being
    // replicated back from public share db - avoids conflicts
    function ensureCreatorFilter(callback) {
        var filter_ddoc = {
            _id: '_design/filter_global-share-creator',
            filters: {
                excludeCreator: (function (doc, req) {
                    return !!(doc.createdBy !== req.name);
                }).toString()
            }
        };
        hoodie.request('POST', dbname, {data: filter_ddoc}, function (err) {
            if (err && err.error === 'conflict') {
                // filter already exists, ignore
                return callback();
            }
            return callback(err);
        });
    }


    // when a user doc is updated, check if we need to setup replication
    hoodie.account.on('user:change', handleChange);

    // remove docs from global share db
    hoodie.task.on('globalshareunpublish:add', function (db, task) {
        async.forEachSeries(task.targets || [], function (target, cb) {
            hoodie.database(dbname).remove(target.type, target.id, cb);
        },
        function (err) {
            if (err) {
                return hoodie.task.error(db, task,
                    'Failed to remove all targets from global share db'
                );
            }
            hoodie.task.success(db, task);
        });
    });

    // initialize the plugin
    async.series([
        async.apply(hoodie.database.add, dbname),
        async.apply(hoodie.database(dbname).addPermission,
            'global-share-per-user-writes',
            permission_check
        ),
        ensureCreatorFilter,
        async.apply(hoodie.database(dbname).grantPublicWriteAccess),
        catchUp
    ],
    callback);

};
