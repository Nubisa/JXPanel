/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");

exports.columns = ["ID", "user_table.plan_name", "value_table.plan_cpu", "value_table.plan_memory"];


exports.getData = function(active_user, cb) {

    if (!sqlite.db) {
        cb(form_lang.Get(active_user.lang, "DBNotOpened"));
        return;
    }

    sqlite.Plan.Get(sqlite.db, null, function(err, rows) {
        if (err)
            cb(err)
        else {
            rows = [];
            for (var y = 1; y <= 100; y++) {
                var row = [];
                for (var x in exports.columns) {
                    row.push(x + "." + y);
                }
                rows.push(row);
            }

            cb(false, rows);
        }

    });

};