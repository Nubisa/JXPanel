/**
 * Created by nubisa on 7/29/14.
 */



//var reg = new RegExp("^[a-z_][a-z0-9_-]*[$]?$", "i");
//
//var str = "s01234567890012345678900123456789kkk";
//
//var test = reg.test(str);
//
//console.log(test,  str.length);


var database = require("./database");
var sqlite2 = require("./sqlite2");
var util = require("util");
var fs = require("fs");


sqlite2.SetFileName(__dirname + "/dbfile.db");

database.ReadDB(function(err) {
    if (err) console.error(err); else console.log(util.inspect(database.DB, { depth : null }));
});
