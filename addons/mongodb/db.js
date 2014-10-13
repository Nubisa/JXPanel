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


exports.AddDB = function(env, db_name, cb) {


    var addonFactory = jxpanel.getAddonFactory(env);

    var dbs = addonFactory.db.get("dbs") || { __id : 0 };

    var new_name = addonFactory.activeUser.name + "#" + (dbs.__id + 1);
    dbs[new_name] = true;
    dbs.__id++;

    addonFactory.db.set("dbs", dbs);

    cb();
    return;

//    var db = new Db("mydb", new Server("localhost", 27017));
//    db.open(function(err, db) {
//        cb(err || "We are connected");
//    });

    var addonFactory = jxpanel.getAddonFactory(env);

    var db = new Db(db_name, new Server('localhost', 27017), { w : 1, strict : true });
// Establish connection to db
    db.open(function(err, db) {

        db.createCollection("init",  function(err, result) {
            result.drop(function(err1, result1) {

                cb(err1 || "We are connected");
//
//                db.close();
            });
        });

//        var options = { roles : [ { role: "dbOwner", db : "test" } ]};
//        db.addUser("kuki", "kuki", options, function(err, result) {
//            console.log("user created?", err, result);
//
//            // Use the admin database for the operation
//            var adminDb = db.admin();
//
//            // List all the available databases
//            adminDb.listDatabases(function(err, dbs) {
//                console.log(dbs);
////            assert.equal(null, err);
////            assert.ok(dbs.databases.length > 0);
//
//                cb(err || "We are connected");
//
//                db.close();
//            });
//        });

    });

//    MongoClient.connect("mongodb://localhost:27017/" + db_name, function(err, db) {
//        if(!err) {
//            console.log("We are connected");
//        } else {
//            console.log("not ocnnected", err);
//        }
//
//        cb(err || "We are connected");
//        console.error("dwa");
//    });
//    console.error("jeden");
};


exports.RemoveDB = function(dbnames, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var dbs = addonFactory.db.get("dbs");

    if (dbs) {

        if (dbs === "all") {
            dbs = {};
        } else {
            for(var a in dbnames) {
                var db_name = dbnames[a];
                delete dbs[db_name];
            }
        }

        addonFactory.db.set("dbs", dbs);
    }

    cb(false)
};


exports.ClearDB = function(db_name) {

};

