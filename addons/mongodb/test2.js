/**
 * Created by root on 10/15/14.
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


var crypto = require("crypto");

var user = {
    login : "kuki",
    pwd : "kuki",
    db : "kukidb"
};

var shell = require("./shell");
var _db = require("./db");

_db.port = 27027;

var url = "localhost:"+_db.port+ "/" + user.db;

var admin = {
    login : "admin3",
    pwd : "admin3"
};

var assert = require("assert");

MongoClient.connect("mongodb://" + url, {native_parser:true}, function(err, db) {
    console.log("open 2", err);
    if (err)
        return;


//
//        var collection = db.collection("simple_document_insert_collection_no_safe");
//        // Insert a single document
//        collection.insert({hello:'world_no_safe'}, function (err, result) {
//            console.log("insert", err, result);
//            // Fetch the document
//            collection.findOne({hello:'world_no_safe'}, function(err, item) {
//
//                console.log("find", err, item.hello);
//                db.close();
//            })
//        });



    var adminDb = db.admin();
    adminDb.authenticate(admin.login, admin.pwd, function(err, result) {
        console.log("authenticate admin", err);



//        var collection = db.collection("system.users");
//        var md5 = crypto.createHash('md5');
//        md5.update(user.login + ":mongo:" + user.pwd + "x");
//        var userPassword = md5.digest('hex');
//        collection.update({user: user.login},{$set: { pwd: userPassword}}, function(err, results, full) {
//            console.log("update password", err, results, full);
//            db.close();
//        });

        db.eval('db.changeUserPassword("'+user.login+'", "'+"krowa"+'")', function(err, result) {
            console.log("db.changeUserPassword", err, result);
            db.close();
        });

//        var collection = db.collection("system.users");
//        collection.find().toArray(function(err, docs) {
//
//            console.log("find", err);
//            if (!err)
//                console.log(docs);
//            db.close();
//
//        });


    });

//    var options = { roles : [ { role: "dbOwner", db : user.db } ]};
//    db.addUser(user.login, user.pwd, options, function(err) {
//        assert.equal(null, err);
//        var uri = "mongodb://" + encodeURIComponent(user.login) + ":" + encodeURIComponent(user.pwd) + "@" + url;
//        MongoClient.connect(uri, {uri_decode_auth: true, native_parser:true}, function(err, authenticatedDb) {
//            assert.equal(null, err);
//            db.close();
//            authenticatedDb.close();
//        });
//    });
});