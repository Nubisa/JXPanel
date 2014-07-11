/**
 * Created by Nubisa Inc. on 7/9/14.
 */


var sqlite = require("./sqlite.js");
var fs = require("fs");
var util = require("util");

var id = 0;

var test = function (db) {


    var next = function () {

        id++;
        if (id > 50) {
            console.log("All finished.")
        } else {
            setTimeout(go, 10);
        }
    };


    var lastRet = null;
    var cb = function (err, data) {

        if (err == "empty") {
            next();
            return;
        }

        if (err) {
            console.log(id, "error:", err)
        } else {
            console.log(id, "OK:", data);
            if (data) {
                if (util.isArray(data))
                    lastRet = data;
//                else
//                    console.log("last added record ID", data);
            }

        }
        console.log("");
        next();
    };


    var go = function () {

        if (id == 1) sqlite.Subscription.AddNew(db, { "subscription_name": "osiem" }, cb); else
        if (id == 2) sqlite.Subscription.AddNew(db, { "subscription_name": "osiems" }, cb); else
        if (id == 3) sqlite.Subscription.Get(db, { }, cb); else
        if (id == 4) sqlite.Subscription.Update(db, { ID : lastRet[0].ID, owner_user_ids : "1,2,3" }, cb); else
        if (id == 5) sqlite.Subscription.Delete(db, { ID : lastRet[1].ID }, cb); else
        if (id == 6) sqlite.Subscription.Get(db, { }, cb); else

//        if (id == 1) sqlite.Subscription.Update(db, { ID : 123 }, cb); else
//        if (id == 2) sqlite.Subscription.Delete(db, { }, cb); else


        if (id == 11) sqlite.Subscription.AddNewFieldRule(db,  { field_name : "xsub_name", field_type : "sometype", default_value_rules :"", default_value : null}, cb); else
        if (id == 12) sqlite.Subscription.AddNewFieldRule(db,  { field_name : "xsub_name2", field_type : "sometype", default_value_rules :"", default_value : null}, cb); else
        if (id == 13) sqlite.Subscription.GetFieldRule(db,  null, cb); else
        if (id == 14) sqlite.Subscription.UpdateFieldRule(db,  { ID : lastRet[0].ID, default_value: "osiem" }, cb); else
        if (id == 15) sqlite.Subscription.DeleteFieldRule(db,  { field_name: "xsub_name2" }, cb); else
        if (id == 16) sqlite.Subscription.GetFieldRule(db,  null, cb); else



        if (id == 21) sqlite.Subscription.AddNewFieldValue(db,  { data_field_table_id : lastRet[0].ID,   owner_table_id : 10, value : 10}, cb); else
        if (id == 22) sqlite.Subscription.AddNewFieldValue(db,  { data_field_table_id : lastRet[0].ID,  owner_table_id : 11, value : 30}, cb); else
        if (id == 23) sqlite.Subscription.GetFieldValue(db,  null, cb); else
        if (id == 24) sqlite.Subscription.UpdateFieldValue(db,  { ID : lastRet[1].ID, value: "osiem" }, cb); else
        if (id == 25) sqlite.Subscription.DeleteFieldValue(db,  { value: "10" }, cb); else
        if (id == 26) sqlite.Subscription.GetFieldValue(db,  null, cb); else

        if (id == 31) sqlite.Subscription.AddNewFieldValue2(db, 10, "xsub_name", "cos", cb); else
        if (id == 32) sqlite.Subscription.AddNewFieldValue2(db, 10, "xsub_name2", "cos2", cb); else
        if (id == 33) sqlite.Subscription.GetFieldValue2(db, 10, "xsub_name", cb); else
        if (id == 34) sqlite.Subscription.UpdateFieldValue2(db, 10, "xsub_name", "siedem", cb); else
        if (id == 35) sqlite.Subscription.DeleteFieldValue2(db, 10, "xsub_name", cb); else
        if (id == 36) sqlite.Subscription.GetFieldValue2(db, 10, "xsub_name", cb); else
        if (id == 37) sqlite.Subscription.GetFieldValue(db,  null, cb); else

            cb("empty");
    };

    next();
};

var dbfile = "./dbfile.db";

if (fs.existsSync(dbfile)) fs.unlinkSync(dbfile);

sqlite.CreateDatabase("./dbfile.db", function (err, db) {
    if (err) {
        console.error(err);
        return;
    } else {
        console.log("DB created OK.");
    }
    test(db);
});


