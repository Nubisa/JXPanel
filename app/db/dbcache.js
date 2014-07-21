/**
 * Created by Nubisa Inc. on 7/21/14.
 */

var sqlite = require("./sqlite.js");

// read only copy of db for sync operations
// it is refreshed each on each reload of the page

exports.tables = null;
exports.error = null;


var getWhere = function (table_name, json_where) {

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    return where.length ? " WHERE " + where.join(" AND ") : "";
};


exports.refresh = function(cb) {


    sqlite.GetAllTablesContents(sqlite.db, null, function(err, all) {
        exports.error = err;
        if (!err) {
            exports.tables = all;
        }

        cb(err);
    });
};


exports.Get = function(table_name, json) {
    var ret = { err : false, ret : null};
    var tables = exports.tables;

    if (!tables[table_name]) {
        return { err : "No table in cache." }
    }

    var t = tables[table_name];
    for(var i in t) {
        var row = t[i];
        var found = row;
        for (var field in json) {
            if (!row[field] || !row[field] + "" === json[field] + "") {
                found = false;
                break;
            }
        }
        if (found)
            return { err : false, ret: found };
        else
            return { err : false, ret : false };
    }
};


