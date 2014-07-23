/**
 * Created by Nubisa Inc. on 7/21/14.
 */

var sqlite = require("./sqlite.js");
var util = require("util");

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


// gets from single table the record/records which fits json criteria
exports.Get = function(table_name, json, asDict) {
    var ret = { err : false, rec : null};
    var tables = exports.tables;

    if (!tables[table_name]) {
        return { err : "No table in cache." }
    }

    var rows = asDict ? {} : [];
    var ids = [];
    var t = tables[table_name];
    for(var i in t) {
        var row = t[i];
        var totalCnt = 0;
        var equalCnt = 0;

        for (var field in json) {
            totalCnt++;

            if (row[field]) {

                // if string
                if (util.isArray(json[field])) {
                    if (json[field].length && json[field].indexOf(row[field]) !== -1)
                        equalCnt++;
                    continue;
                }

                if (row[field] + "" === json[field] + "") {
                    equalCnt++;
                    continue;
                }
            }
        }
        if (totalCnt === equalCnt) {
            if (asDict) {
                rows[row["ID"]] = row;
            } else {
                rows.push(row);
            }
            ids.push(row["ID"]);
        }
    }

    return { err : false, rec : rows, ids : ids}
};

/**
 * gets json object containing fields for specific table_name
 * @param table_name
 * @return {{}}
 * @constructor
 *
 * @example
 *
 *  { '1405504829902':
       { ID: '1405504829902',
         table_name: 'plan_table',
         field_name: 'plan_overuse',
         field_type: null,
         default_value_rules: null,
         default_value: null },
      ... other fields,
     }
 */
exports.GetFields = function(table_name) {
    var tables = exports.tables;

    var ret = {};
    var table = tables[sqlite.data_field_table];
    for(var i in table) {
        if (table[i]["table_name"] === table_name) {
            ret[table[i]["ID"]] = table[i];
        }
    }

    return ret;
};


// gets from single table (main table and also data_value_table) the record/records which fits json criteria
exports.GetAll = function(table_name, json) {

    var ret = exports.Get(table_name, json);
    if (ret.err) return ret;


    var tables = exports.tables;
    var table = tables[sqlite.data_value_table];

    // ret.rec is array of rows
    for(var rowID in ret.rec) {
        var id = ret.rec[rowID]["ID"];

        var fields = exports.GetFields(table_name);

        // getting values from data_value_table
        for(var i in table) {
            var field_id = table[i]["data_field_table_id"];
            var owner_table_id = table[i]["owner_table_id"];
            if (fields[field_id] && owner_table_id + "" === id + "") {
                var field_name = fields[field_id]["field_name"];
                ret.rec[rowID][field_name] = table[i]["value"];
            }
        }
    }

//    console.log("GetAll", json, ret);
    return ret;
};


exports.Get