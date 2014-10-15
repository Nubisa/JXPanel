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


    MongoClient.connect("mongodb://localhost:27027/" + "jxpanel_test", function(err, db) {
        if(!err) {
            console.log("We are connected");
            db.close();
        } else {
            console.log("not connected", err);
        }
    });

var osinfo = jxcore.utils.OSInfo();
console.log(osinfo);