/**
 * Created by root on 10/1/14.
 */


var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON,
    assert = require('assert');

exports.port = null;

var admin = {
    login: "jxpanel_admin",
    pwd: "jxpanel_admin_2015"
};

exports.AddDB = function (env, pwd, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);
    var user_name = addonFactory.activeUser.data.name;

    exports.GetUserDatabases(user_name, function (err, dbs, nextId) {

        if (err) {
            cb(err);
            return;
        }

        var new_name = user_name + "#" + nextId;
        var db_name = new_name;

        exports.ConnectAsAdmin(db_name, function (err, db) {

            if (err) {
                cb(err);
                return;
            }

            var options = { roles: [ "dbOwner" ] };
            db.addUser(new_name, pwd, options, function (err, result) {

                db.close();
                if (err) {
                    cb("Cannot add user: " + err);
                    return;
                }

                cb();
            });
        });
    });
};

var removeSingleDB = function (dbname, cb) {

    exports.ConnectAsAdmin(dbname, function (err, db) {

        if (err) {
            cb(err);
            return;
        }

        db.dropDatabase(function (err, result) {

            if (err) {
                cb("Cannot drop database `" + dbname + "`: " + err);
                return;
            }

            // removing user associated with db
            db.removeUser(dbname, function (err, result) {
                db.close();
                if (err) {
                    cb("Cannot remove user `" + dbname + "`: " + err);
                    return;
                }

                cb();
            });
        });
    });
};


exports.RemoveDB = function (env, dbnames, cb) {

    var len = dbnames.length;
    var errors = [];
    var _cb = function (err) {
        if (err)
            errors.push(err);
        len--;

        if (!len) {
            cb(errors.length ? errors.join(", ") : null);
        }
    };

    for (var a in dbnames)
        removeSingleDB(dbnames[a], _cb);
};


exports.ClearDB = function (db_name) {

};


exports.TestConnection_jump = function (asAdmin) {

    var connected = false;
    var error = null;

    if (asAdmin)
        var url = "mongodb://" + admin.login + ":" + admin.pwd + "@localhost:" + exports.port + "/" + "jxpanel_test";
    else
        var url = "mongodb://localhost:" + exports.port + "/" + "jxpanel_test";

    MongoClient.connect(url, function (err, db) {

        connected = !err;
        error = err;
        if (db) db.close();
        jxcore.utils.continue();
    });

    jxcore.utils.jump();

    return { connected: connected, err: error};
};


// connects to mongoand returns db instance
exports.Connect = function (dbname, cb) {

    var dbnameProvided = typeof(dbname) === "string" && cb;
    var _dbname = dbnameProvided ? dbname : "admin";
    var cb = dbnameProvided ? cb : dbname;

    var db = new Db(_dbname, new Server('localhost', exports.port), { w: 1, strict: true });
    db.open(function (err, db) {

        if (err) {
            cb("Cannot connect to database: " + err);
            return;
        }

        cb(false, db);
    });
};

// connects to mongo, authenticates as admin admin and returns db instance
exports.ConnectAsAdmin = function (dbname, cb) {

    var dbnameProvided = typeof(dbname) === "string" && cb;
    var _dbname = dbnameProvided ? dbname : "admin";
    var cb = dbnameProvided ? cb : dbname;

    exports.Connect(_dbname, function (err, db) {

        if (err) {
            cb(err);
            return;
        }

        var adminDb = db.admin();
        adminDb.authenticate(admin.login, admin.pwd, function (err, result) {

            // last arg says, that connection was possible, but authentication failed
            cb(err ? "Cannot authenticate as admin: " + err : null, db, true);
        });
    });
};


exports.CreateAdmin = function (cb) {


    exports.Connect(function (err, db) {

        if (err) {
            cb(err);
            return;
        }

        var adminDb = db.admin();

        var options = {
            roles: [ "userAdminAnyDatabase", "readWriteAnyDatabase", "dbAdminAnyDatabase" ]
        };

        adminDb.addUser(admin.login, admin.pwd, options, function (err, result) {

            if (err) {
                db.close();
                cb("Cannot create admin user: " + err);
                return;
            }

            adminDb.authenticate(admin.login, admin.pwd, function (err, result) {

                if (err) {
                    db.close();
                    cb("Cannot authenticate as admin: " + err);
                    return;
                }

                var role = {
                    createRole: "myRole",
                    privileges: [
                        { resource: { anyResource: true }, actions: [ "anyAction"] }
                    ],
                    roles: []
                };

                db.command(role, function (err, result) {

                    if (err) {
                        db.close();
                        cb("Cannot create admin's role: " + err);
                        return;
                    }

                    var grant = { grantRolesToUser: admin.login, roles: [ "myRole"], writeConcern: { w: 1} }
                    db.command(grant, function (err, result) {

                        if (err) {
                            db.close();
                            cb("Cannot grant admin's role: " + err);
                            return;
                        }

                        db.close();
                        cb();
                    });
                });
            });
        });
    });
};


exports.GetUserDatabases = function (user_name, cb) {

    exports.ConnectAsAdmin(function (err, db) {

        if (err) {
            cb(err);
            return;
        }

        var collection = db.collection("system.users");
        collection.find().toArray(function (err, docs) {

            db.close();

            if (err) {
                cb("Cannot read users info: " + err);
                return;
            }

            var max_id = 0;
            var dbs = [];
            for (var a in docs) {
                var rec = docs[a];

                /*
                 { _id: 'nubisa#25.nubisa#25',
                 user: 'nubisa#25',
                 db: 'nubisa#25',
                 credentials: { 'MONGODB-CR': 'a1f94fe7846deccdd6cbff6fc0d39103' },
                 customData: {},
                 roles: [ [Object] ]
                 }
                 */

                var parsed = rec.db.split("#");
                var _user_name = parsed[0];
                var id = parseInt(parsed[1]);

                if (user_name === _user_name) {
                    dbs.push(rec.db);
                    if (id > max_id) max_id = id;
                }
            }

            dbs.sort();
            cb(false, dbs, max_id + 1);
        });
    });
};


var changeSingleUserPassword = function (user_name, pwd, cb) {

    var dbname = user_name;
    exports.ConnectAsAdmin(dbname, function (err, db) {

        if (err) {
            cb(err);
            return;
        }

        db.eval('db.changeUserPassword("' + user_name + '", "' + pwd + '")', function (err, result) {
            db.close();
            if (err) {
                cb("Cannot change users password: " + err);
                return;
            }
            cb();
        });
    });
};


exports.ChangeUsersPasswords = function (env, dbnames, pwd, cb) {

    var len = dbnames.length;
    var errors = [];
    var _cb = function (err) {
        if (err)
            errors.push(err);
        len--;

        if (!len) {
            cb(errors.length ? errors.join(", ") : null);
        }
    };

    for (var a in dbnames)
        changeSingleUserPassword(dbnames[a], pwd, _cb);
};