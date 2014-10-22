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



var shell = require("./shell");
var _db = require("./db");

_db.port = 27027;



var admin = {
    login : "admin3",
    pwd : "admin3"
};

var user = {
    login : "kuki",
    pwd : "kuki",
    db : "kukidb"
};

var user11 = {
    login : "kuki",
    userSource : user.db,
    db : "kuki2db"
};

//var user1 = {
//    login : "kuki1",
//    pwd : "kuki1",
//    db : "kuki1db"
//};
//
//var user2 = {
//    login : "kuki2",
//    pwd : "kuki2",
//    db : "kuki2db"
//};


var createUser = function(user) {

//    MongoClient.connect("mongodb://" +admin.login + ":"+ admin.pwd+"@localhost:" + _db.port + "/" + user.db, function(err, db) {
    MongoClient.connect("mongodb://localhost:" + _db.port + "/" + user.db, function(err, db) {

        console.log("open 2", err);
        if (err)
            return;

        var adminDb = db.admin();
        adminDb.authenticate(admin.login, admin.pwd, function(err, result) {
            console.log("authenticate admin", err);


            var options = { roles : [ { role: "dbOwner", db : user.db } ]};
            db.addUser(user.login, user.pwd, options, function(err, result) {
                console.log("addUser", err, result);

                db.authenticate(user.login, user.pwd, function(err, result) {
                    console.log("autenticate", err, result);

                    db.close();
                });
            });


//            var addUser = { addUser : user.login,
//                roles : [ "dbOwner"],
//                writeConcern: { w: 1}
//            };
//
//            db.command(addUser, function(err, result) {
//                console.log("command addUser", err, result);
//
//                db.authenticate(user.login, user.pwd, function(err, result) {
//                    console.log("autenticate", err, result);
//
//                    db.close();
//                });
//            });
        });




    });

};


var updatePassword = function(user) {

//    MongoClient.connect("mongodb://" +admin.login + ":"+ admin.pwd+"@localhost:" + _db.port + "/" + user.db, function(err, db) {
    MongoClient.connect("mongodb://localhost:" + _db.port + "/" + user.db, function(err, db) {

        console.log("open 2", err);
        if (err)
            return;

        var adminDb = db.admin();
        adminDb.authenticate(admin.login, admin.pwd, function(err, result) {
            console.log("authenticate admin", err);

            console.log(db.users);

//            var options = { roles : [ { role: "dbOwner", db : user.db } ]};
//            db.addUser(user.login, user.pwd, options, function(err, result) {
//                console.log("addUser", err, result);
//
//                db.authenticate(user.login, user.pwd, function(err, result) {
//                    console.log("autenticate", err, result);
//                    db.close();
//                });
//
//            });


        });




    });

};


createUser(user);
//createUser(user11);
//createUser(user1);
//createUser(user2);

//updatePassword(user);