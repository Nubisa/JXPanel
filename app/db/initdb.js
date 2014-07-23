/**
 * Created by Nubisa Inc. on 7/11/14.
 */


// adds field definitions based on forms definitions


var fs = require("fs");
var path = require("path");

var recreate = process.argv[process.argv.length-1] == "true";

if (recreate) {
    fs.unlinkSync("./dbfile.db");
}


var sqlite = require("./sqlite");



var createFields = function (db, table, controls) {

    var fields = [];
    for (var id in controls) {
        var ctrl = controls[id];
        if (!ctrl.name) continue;

        if (ctrl.details.dbTable && ctrl.details.dbTable !== "main") {
            continue;
        }
        var json = { field_name: ctrl.name };
        fields.push(json);
    }

//    console.log(fields);

    table.AddNewFieldRules(db, fields, function (err) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Fields Added");
        }
    });
};


var start = Date.now();

var go = function() {

    if (sqlite.db) {
        console.log("DB ready");
        var fname = path.join(__dirname, "../definitions/forms/addUser");
        var mod = require(fname);
        var form = mod.form();
        createFields(sqlite.db, sqlite.User, form.controls);

        var fname = path.join(__dirname, "../definitions/forms/addPlan");
        var mod = require(fname);
        var form = mod.form();
        createFields(sqlite.db, sqlite.Plan, form.controls);


        var fname = path.join(__dirname, "../definitions/forms/addDomain");
        var mod = require(fname);
        var form = mod.form();
        createFields(sqlite.db, sqlite.Domain, form.controls);

        setTimeout(function() {
            var json = { plan_name : "Unlimited", "user_owner_id" : "root" };
            sqlite.Plan.AddNewOrUpdateAll(sqlite.db, json, { insert : ["plan_name"], update: ["ID"]}, function(err) {
                if (err) {
                    console.log("Cannot add plan", err);
                } else {
                    console.log("Plan 'Unlimited' Added");
                }
            });
        }, 2000);


    } else {
        if (Date.now() - start < 2000) {
            setTimeout(go, 50);
        } else {
            console.log("DB was not opened");
        }
    }
};

// waiting for sqlite to open db file
go();

