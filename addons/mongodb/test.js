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


//    //MongoClient.connect("mongodb://kuki:kuk@localhost:27027/nubisa#14", function(err, db) {
//    MongoClient.connect("mongodb://localhost:27027/jxpanel_text", function(err, db) {
//        if(!err) {
//            console.log("We are connected");
//            db.close();
//        } else {
//            console.log("not connected", err);
//        }
//    });

//var osinfo = jxcore.utils.OSInfo();
//console.log(osinfo);


var shell = require("./shell");
var _db = require("./db");

_db.port = 27027;

//console.log("test conn", _db.TestConnection());
//console.log("test conn", _db.TestConnection());
//console.log("test conn", _db.TestConnection());
//console.log("test conn", _db.TestConnection());
//console.log("test conn", _db.TestConnection());
//
//
//console.log("create admin", _db.CreateAdmin());



//console.log("test conn", _db.TestConnection(true));

//shell.mongoCreateAdmin(function(err) {
//   console.log(err);
//});

var admin = {
    login : "admin3",
    pwd : "admin3"
};

var user = {
    login : "kuki",
    pwd : "kuki",
    db : "kukidb"
};



var createAdmin = function() {
    var db = new Db('admin', new Server('localhost', 27027),  { w : 1, strict : true });
    db.open(function(err, db) {

        console.log("open", err);
        if (err)
            return;

        // Use the admin database for the operation
        var adminDb = db.admin();

        var options = {
            roles : [
            { role: "userAdminAnyDatabase", db : "admin" },
//            { role: "userAdmin", db : "admin" },
//            { role: "readWriteAnyDatabase", db : "admin" },
//            { role: "readWrite", db : "admin" },
//            { role: "dbAdminAnyDatabase", db : "admin" }
//            { role: "dbAdmin", db : "admin" },
//            { role: "clusterAdmin", db : "admin" },
//            { role: "__system", db : "admin" },
//            { role: "root", db : "admin" }
            ]
        };
        // Add the new user to the admin database
        adminDb.addUser(admin.login, admin.pwd, options, function(err, result) {
            console.log("addUser", err, result);
            // Authenticate using the newly added user
            adminDb.authenticate(admin.login, admin.pwd, function(err, result) {
                console.log("autenticate", err, result);
//            assert.ok(result, "what result");

                // Retrive the build information for the MongoDB instance
//            adminDb.buildInfo(function(err, info) {
//                assert.ok(err == null);

//                db.removeUser('admin3', function(err, result) {
//                    console.log("remove", err, result);
//
//
               // db.close();

                var role = {
                    createRole: "myRole",
                    privileges : [ { resource : { anyResource : true } , actions: [ "anyAction"] } ],
                    roles : []
                };
//                db.eval('db.createRole("myRole", ' + role + ')', function(err, result) {
//                    console.log("db.createRole", err, result);
//                    db.close();
//                });


                db.command(role, function(err, result) {
                    console.log("command createRole", err, result);


                    var grant = { grantRolesToUser : admin.login, roles : [ "myRole"], writeConcern: { w: 1} }
                    db.command(grant, function(err, result) {
                        console.log("command", err, result);

                        db.close();
                    });
                });

               // createUser();
//                });
//            });
            });
        });
    });
}

createAdmin();


var createUser = function() {

    MongoClient.connect("mongodb://" +admin.login + ":"+ admin.pwd+"@localhost:" + _db.port + "/" + "admin", function(err, db) {

        console.log("open 2", err);
        if (err)
            return;


        //var adminDb = db.admin();
        var options = { roles : [ { role: "dbOwner", db : user.kukidb } ]};
        db.addUser(user.login, user.pwd, options, function(err, result) {
            console.log("addUser", err, result);

            db.authenticate(user, 'nubisa', function(err, result) {
                console.log("autenticate", err, result);
                db.close();
            });

        });

    });

};



