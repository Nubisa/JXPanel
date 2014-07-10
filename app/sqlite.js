/**
 * Created by Nubisa Inc. on 7/9/14.
 */


var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

// ########## table names

var subscription_table = "subscription_table";
var user_table = "user_table";
var domain_table = "domain_table";

var data_field_table = "data_field_table";
var data_value_table = "data_value_table";


// ########## table definitions

var tables = {};
tables[subscription_table] = {
    "ID": { type: "INTEGER", required: true },
    "subscription_name": { type: "TEXT", required: true },
    "owner_user_ids": { type: "TEXT" }
};

tables[user_table] = {
    "ID": { type: "INTEGER", required: true },
    "subscription_table_id": { type: "INTEGER", required: true },
    "username": { type: "TEXT", required: true },
    "password": { type: "TEXT", required: true }
};

tables[domain_table] = {
    "ID": { type: "INTEGER", required: true },
    "subscription_table_id": { type: "INTEGER", required: true },
    "domain_name": { type: "TEXT", required: true }
};

tables[data_field_table] = {
    "ID": { type: "INTEGER", required: true },
    "table_name": { type: "TEXT", required: true },
    "field_name": { type: "TEXT", required: true },
    "field_type": { type: "TEXT"},
    "default_value_rules": { type: "TEXT"},
    "default_value": { type: "TEXT"}
};

tables[data_value_table] = {
    "ID": { type: "INTEGER", required: true },
    "data_field_table_id": { type: "INTEGER", required: true },
    "owner_table_id": { type: "INTEGER", required: true }
};


// ########## private definitions


var createTable = function (db_object, table_name, json_fields, cb) {

    var columns = [];

    for (var field in json_fields) {
        var type = json_fields[field].type;
        columns.push(field + " " + type);
    }

    if (!columns.length) {
        return "None columns were provided for table definition.";
    }

    var sql = "CREATE TABLE IF NOT EXISTS " + table_name + "(" + columns.join(", ") + ")";

    db_object.run(sql, cb);
};


var checkFieldValue = function (table_name, field_name, json, cb) {

    var fieldDef = tables[table_name][field_name];

    if (!fieldDef) {
        if (cb) {
            cb("Field " + field_name + " does not exist in table " + table_name);
        }
        return false;
    }

    return true;
};


var checkRequiredFields = function (table_name, json, cb) {
    var fields = tables[table_name];

    for (var field_name in fields) {
        var fieldDef = fields[field_name];
        if (fieldDef.required && !json[field_name]) {
            if (cb) {
                cb("Field " + field_name + " is required for table " + table_name);
            }
            return false;
        }
    }
    return true;
};

var getRecord = function (table_name, db_object, json_where, cb) {

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
    var sql = "SELECT * FROM " + table_name + " " + strWhere;
    console.log("getFieldRule sql:", sql);
    db_object.all(sql, cb);
};


var addRecord = function (table_name, db_object, json, cb) {

    if (!checkRequiredFields(table_name, json, cb)) {
        return;
    }

    var columns = [];
    var values = [];

    for (var field in json) {
        if (!checkFieldValue(table_name, field, json, cb)) {
            return;
        }
        columns.push(field);
        values.push(json[field]);
    }

    if (!columns.length) {
        if (cb) {
            cb("None columns were provided for inserting new record.");
        }
        return;
    }

    var sql = "INSERT INTO " + table_name + " (" + columns.join(", ") + ") VALUES ('" + values.join("', '") + "')";
    console.log("addNewFieldRule sql:", sql);
    db_object.run(sql, cb);
};

var updateRecord = function (table_name, db_object, json, cb) {

    var updates = [];

    if (!json || !json.ID) {
        if (cb) {
            cb("ID column must be provided for updating the record.");
        }
        return;
    }

    for (var field in json) {
        if (field !== "ID") {
            updates.push(field + " = '" + json[field] + "'");
        }
    }

    if (!updates.length) {
        if (cb) {
            cb("None columns were provided for updating the record.");
        }
        return;
    }

    var sql = "UPDATE " + table_name + " SET " + updates.join(", ") + " WHERE ID = " + json.ID;
    console.log("updateFieldRule sql:", sql);
    db_object.run(sql, cb);
};


var deleteRecord = function (table_name, db_object, json_where, cb) {

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
    var sql = "DELETE FROM " + table_name + " " + strWhere;
    console.log("deleteFieldRule sql:", sql);
    db_object.all(sql, cb);
};




var getFieldRule = function (table_name, db_object, json_where, cb) {

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
    var sql = "SELECT * FROM " + table_name + " " + strWhere;
    console.log("getFieldRule sql:", sql);
    db_object.all(sql, cb);
};


var addNewFieldRule = function (table_name, db_object, json, cb) {

    var columns = [];
    var values = [];

    for (var field in json) {
        columns.push(field);
        values.push(json[field]);
    }

    if (!columns.length) {
        if (cb) {
            cb("None columns were provided for inserting new record.");
        }
        return;
    }

    var _cb = function(err) {

    };

//    db_object.all("SELECT max(ID) from " + da)

    db_object.run("BEGIN TRANSACTION");


    addRecord(data_field_table, db_object, { table_name : table_name, field_name : json.field_name, field_type: json.field_type, default_value_rules : json.default_value_rules, default_value_rules : json.default_value_rules }, _cb);
    addRecord(data_value_table, db_object, { })
    var sql = "INSERT INTO " + table_name + " (" + columns.join(", ") + ") VALUES ('" + values.join("', '") + "')";
    console.log("addNewFieldRule sql:", sql);
    db_object.run(sql, cb);

    db.run("COMMIT TRANSACTION");
};

// todo: not yet implemented
//
//var updateFieldRule = function (table_name, db_object, json, cb) {
//
//    var updates = [];
//
//    if (!json || !json.ID) {
//        if (cb) {
//            cb("ID column must be provided for updating the record.");
//        }
//        return;
//    }
//
//    for (var field in json) {
//        if (field !== "ID") {
//            updates.push(field + " = '" + json[field] + "'");
//        }
//    }
//
//    if (!updates.length) {
//        if (cb) {
//            cb("None columns were provided for updating the record.");
//        }
//        return;
//    }
//
//    var sql = "UPDATE " + table_name + " SET " + updates.join(", ") + " WHERE ID = " + json.ID;
//    console.log("updateFieldRule sql:", sql);
//    db_object.run(sql, cb);
//};
//
//
//var deleteFieldRule = function (table_name, db_object, json_where, cb) {
//
//    var where = [];
//    for (var field in json_where) {
//        where.push(field + " = '" + json_where[field] + "'");
//    }
//
//    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
//    var sql = "DELETE FROM " + table_name + " " + strWhere;
//    console.log("deleteFieldRule sql:", sql);
//    db_object.all(sql, cb);
//};


/**
 *
 * @param file_name
 * @param cb (err: true || string, db_object)
 * @constructor
 */
exports.CreateDatabase = function (file_name, cb) {

    if (fs.existsSync(file_name)) {
        if (cb) {
            cb("The database file already exists.", null);
        }
        return;
    }

    var db_object = null;

    try {
        db_object = new sqlite3.Database(file_name);
    } catch (ex) {
        if (cb) {
            cb("Cannot create database file: " + ex, null);
        }
    }

    if (!db_object) {
        if (cb) {
            cb("Cannot create database file.", null);
        }
        return;
    }

    var len = 5;
    var _cb = function (err) {
        var errors = [];
        len--;

        if (err) {
            errors.push(err);
        }

        if (len === 0 && cb) {
            var errStr = errors.length ? errors.join("\n") : null;
            cb(errStr, errStr ? null : db_object);
        }
    };


    for (var table_name in tables) {
        createTable(db_object, table_name, tables[table_name], _cb);
    }
};


// ############  public methods

exports.Subscription = {

    AddNew: function (db_object, json, cb) {
        addRecord(subscription_table, db_object, json, cb)
    },

    Get: function (db_object, json, cb) {
        getRecord(subscription_table, db_object, json, cb)
    },

    Update: function (db_object, json, cb) {
        updateRecord(subscription_table, db_object, json, cb)
    },

    Delete: function (db_object, json, cb) {
        deleteRecord(subscription_table, db_object, json, cb)
    },

    AddNewFieldRule: function (db_object, json, cb) {
        addNewFieldRule(subscription_table, db_object, json, cb)
    },

    GetFieldRule: function (db_object, json, cb) {
        getFieldRule(subscription_table, db_object, json, cb)
    },

    UpdateFieldRule: function (db_object, json, cb) {
        updateFieldRule(subscription_table, db_object, json, cb)
    },

    DeleteFieldRules: function (db_object, json, cb) {
        deleteFieldRule(subscription_table, db_object, json, cb)
    }
};




exports.User = {

    AddNew: function (db_object, json, cb) {
        addRecord(user_table, db_object, json, cb)
    },

    Get: function (db_object, json, cb) {
        getRecord(user_table, db_object, json, cb)
    },

    Update: function (db_object, json, cb) {
        updateRecord(user_table, db_object, json, cb)
    },

    Delete: function (db_object, json, cb) {
        deleteRecord(user_table, db_object, json, cb)
    },

    AddNewFieldRule: function (db_object, json, cb) {
        addNewFieldRule(user_table, db_object, json, cb)
    },

    GetFieldRule: function (db_object, json, cb) {
        getFieldRule(user_table, db_object, json, cb)
    },

    UpdateFieldRule: function (db_object, json, cb) {
        updateFieldRule(user_table, db_object, json, cb)
    },

    DeleteFieldRules: function (db_object, json, cb) {
        deleteFieldRule(user_table, db_object, json, cb)
    }
};



exports.Domain = {

    AddNew: function (db_object, json, cb) {
        addRecord(domain_table, db_object, json, cb)
    },

    Get: function (db_object, json, cb) {
        getRecord(domain_table, db_object, json, cb)
    },

    Update: function (db_object, json, cb) {
        updateRecord(domain_table, db_object, json, cb)
    },

    Delete: function (db_object, json, cb) {
        deleteRecord(domain_table, db_object, json, cb)
    },

    AddNewFieldRule: function (db_object, json, cb) {
        addNewFieldRule(domain_table, db_object, json, cb)
    },

    GetFieldRule: function (db_object, json, cb) {
        getFieldRule(domain_table, db_object, json, cb)
    },

    UpdateFieldRule: function (db_object, json, cb) {
        updateFieldRule(domain_table, db_object, json, cb)
    },

    DeleteFieldRules: function (db_object, json, cb) {
        deleteFieldRule(domain_table, db_object, json, cb)
    }
};