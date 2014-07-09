/**
 * Created by Nubisa Inc. on 7/9/14.
 */


var sqlite = require("./sqlite.js");
var fs = require("fs");

var test = function (db) {

    var id = 0;


    var next = function () {

        id++;
        if (id > 50) {
            console.log("All finished.")
        } else {
            setTimeout(go, 10);
        }
    };

    var cb = function (err, data) {

        if (err == "empty") {
            next();
            return;
        }

        if (err) {
            console.log(id, "error:", err)
        } else {
            console.log(id, "OK:", data);
        }
        console.log("");
        next();
    };


    var go = function () {

        if (id == 1) sqlite.Subscription.AddNew(db, { ID: 1, "subscription_name": "osiem" }, cb); else
        if (id == 2) sqlite.Subscription.Update(db, { "ID": 1, "subscription_name": "dwa" }, cb); else
        if (id == 3) sqlite.Subscription.Get(db, { "ID": 1}, cb); else
        if (id == 4) sqlite.Subscription.Delete(db, { "ID": 1}, cb); else
        if (id == 5) sqlite.Subscription.Get(db, { "ID": 1}, cb); else
//        if (id == 2) sqlite.Subscription.Get(db,  { "ID": 1 }, callback);


        // field_name, field_type, default_value_rules, default_value, value


//        if (id == 11) sqlite.Subscription.AddNewFieldRule(db, { "ID": 1, field_name : "xsub_name", field_type : "", default_value_rules :"", default_value : null, value : "some_value"}, cb); else
//        if (id == 12) sqlite.Subscription.UpdateFieldRule(db, { "ID": 1, "subscription_name": "dwa" }, cb); else
//        if (id == 13) sqlite.Subscription.GetFieldRule(db, { "ID": 1}, cb); else
//        if (id == 14) sqlite.Subscription.DeleteFieldRules(db, { "ID": 1}, cb); else
//        if (id == 15) sqlite.Subscription.GetFieldRule(db, { "ID": 1}, cb); else
            cb("empty");
    };

    next();
};

var dbfile = "./dbfile.db";

sqlite.CreateDatabase("./dbfile.db", function (err, db) {
    if (err) {
        console.error(err);
        return;
    }
    test(db);
});


