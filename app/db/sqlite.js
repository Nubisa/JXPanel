/**
 * Created by Nubisa Inc. on 7/9/14.
 */


var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

var counter = 1;

// ########## table names

var subscription_table = "subscription_table";
var user_table = "user_table";
var domain_table = "domain_table";

var data_field_table = "data_field_table";
var data_value_table = "data_value_table";


// ########## table definitions

var tables = {};
tables[subscription_table] = {
    "ID": { type: "CHAR(20)", required: true, primary: true },
    "subscription_name": { type: "TEXT", required: true, unique: true},
    "owner_user_ids": { type: "TEXT" }
};

tables[user_table] = {
    "ID": { type: "CHAR(20)", required: true, primary: true},
    "subscription_table_id": { type: "CHAR(20)", required: true },
    "username": { type: "TEXT", required: true, unique: true},
    "password": { type: "TEXT", required: true }
};

tables[domain_table] = {
    "ID": { type: "CHAR(20)", required: true, primary: true },
    "subscription_table_id": { type: "CHAR(20)", required: true },
    "domain_name": { type: "TEXT", required: true, unique: true }
};

tables[data_field_table] = {
    "ID": { type: "CHAR(20)", required: true, primary: true },
    "table_name": { type: "TEXT", required: true, unique1 : true },
    "field_name": { type: "TEXT", required: true, unique1 : true },
    "field_type": { type: "TEXT"},
    "default_value_rules": { type: "TEXT"},
    "default_value": { type: "TEXT"}
};

tables[data_value_table] = {
    "ID": { type: "CHAR(20)", required: true, primary: true},
    "data_field_table_id": { type: "CHAR(20)", required: true, unique1 : true },
    "owner_table_id": { type: "INTEGER", required: true, unique1 : true },
    "value" : { type : "TEXT" }
};



// ########## private methods


// generates sql query for creating table, with indexes
var getCreateTableQuery = function (table_name) {
    var ret = { err: false, sql: "" };

    var columns = [];
    var unique = [];
    var uniques = {};
    var sql = [];

    for (var field_name in tables[table_name]) {
        var field = tables[table_name][field_name];
        if (field.unique1) {
            if (!uniques[table_name]) uniques[table_name] = [];
            uniques[table_name].push(field_name);
        }
    }

    for (var field_name in tables[table_name]) {
        var field = tables[table_name][field_name];
        var str = field_name + " " + field.type;

        if (field.primary) str += " PRIMARY KEY NOT NULL";
        if (field.unique) str += " NOT NULL UNIQUE";
        columns.push(str);
    }

    for (var field_name in uniques) {
        unique.push("CREATE UNIQUE INDEX " + table_name + "_" + field_name + " on " + table_name + " (" + uniques[field_name].join(", ") + ");");
    }

    if (!columns.length) {
        ret.err = "None columns were provided for table definition.";
        return ret;
    }

    sql.push("CREATE TABLE " + table_name + " (" + columns.join(", ") + ");");
    sql = sql.concat(unique);
    ret.sql = sql;

//    console.log("Create table\n",sql);

    return ret;
};


// return err string or null if field value is ok
var checkFieldValue = function (table_name, field_name, json) {

    var fieldDef = tables[table_name][field_name];

    if (!fieldDef) {
        return "Field `" + field_name + "` does not exist in table " + table_name;
    }

    return null;
};


// return err string or null if fields are ok
var checkRequiredFields = function (table_name, json) {
    var fields = tables[table_name];

    for (var field_name in fields) {
        var fieldDef = fields[field_name];
        if (fieldDef.required && !json[field_name]) {
            return "Field `" + field_name + "` is required for table `" + table_name +"`.";
        }
    }
    return null;
};


var getInsertQuery = function (table_name, json) {
    var ret = { err: false, sql: "" };

    json.ID = Date.now() + (counter++);

    ret.err = checkRequiredFields(table_name, json);
    if (ret.err) return ret;

    var columns = [];
    var values = [];

    for (var field in json) {
        ret.err = checkFieldValue(table_name, field, json);
        if (ret.err) return ret;

        columns.push(field);
        values.push(json[field]);
    }

    if (!columns.length) {
        ret.err = "None columns were provided for inserting new record.";
        return ret;
    }

    ret.sql = "INSERT INTO " + table_name + " (" + columns.join(", ") + ") VALUES ('" + values.join("', '") + "')";
//    console.log("getInsertQuery sql:", ret.sql);
    return ret;
};


var getSelectQuery = function (table_name, json_where) {
    var ret = { err: false, sql: "" };

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
    ret.sql = "SELECT * FROM " + table_name + " " + strWhere;
//    console.log("getSelectQuery sql:", ret.sql);
    return ret;
};

var getUpdateQuery = function (table_name, json) {
    var ret = { err: false, sql: "" };

    var updates = [];

    if (!json || !json.ID) {
        ret.err = "ID column must be provided for updating the record.";
        return ret;
    }

    for (var field in json) {
        if (field !== "ID") {
            updates.push(field + " = '" + json[field] + "'");
        }
    }

    if (!updates.length) {
        ret.err = "You must provide for update some column values other than ID.";
        return ret;
    }

    ret.sql = "UPDATE " + table_name + " SET " + updates.join(", ") + " WHERE ID = '" + json.ID + "'";
//    console.log("getUpdateQuery sql:", ret.sql);
    return ret;
};


var getDeleteQuery = function (table_name, json_where) {
    var ret = { err: false, sql: "" };

    var where = [];
    for (var field in json_where) {
        where.push(field + " = '" + json_where[field] + "'");
    }

    if (!where.length) {
        ret.err = "Delete criteria were not provided.";
        return ret;
    }

    var strWhere = where.length ? " WHERE " + where.join(" AND ") : "";
    ret.sql = "DELETE FROM " + table_name + " " + strWhere;

//    console.log("getDeleteQuery sql:", ret.sql);
    return ret;
};


// cb receives only one param: err
var addRecord = function (table_name, db_object, json, cb) {

    var ret = getInsertQuery(table_name, json);

    if (ret.err) {
        if (cb) {
            cb(ret.err)
        }
    } else {
        db_object.run(ret.sql, cb);
    }
};

// cb receives two param: err, rows
var getRecord = function (table_name, db_object, json_where, cb) {

    if (!cb) {
        throw "The callback is required";
        return;
    }

    var ret = getSelectQuery(table_name, json_where);
    if (ret.err) {
        cb(ret.err)
    } else {
        db_object.all(ret.sql, cb);
    }
};

// cb receives only one param: err
var updateRecord = function (table_name, db_object, json, cb) {

    var ret = getUpdateQuery(table_name, json);
    if (ret.err) {
        if (cb) {
            cb(ret.err)
        }
    } else {
        db_object.run(ret.sql, cb);
    }
};

// cb receives only one param: err
var deleteRecord = function (table_name, db_object, json_where, cb) {

    var ret = getDeleteQuery(table_name, json_where);
    if (ret.err) {
        if (cb) {
            cb(ret.err)
        }
    } else {
        db_object.run(ret.sql, cb);
    }
};


/**
 *
 * @param file_name
 * @param cb (err: true || string, db_object)
 * @constructor
 */
exports.CreateDatabase = function (file_name, cb) {

    if (!cb) {
        throw "The callback is required";
        return;
    }

    var exists = fs.existsSync(file_name);

    var db_object = null;

    try {
        var mode = exists ? sqlite3.OPEN_READWRITE : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE;
        db_object = new sqlite3.Database(file_name, mode);
    } catch (ex) {
        cb("Cannot create database file: " + ex, null);
        return;
    }

    if (exists) {
        cb(null, db_object);
        return;
    }

    if (!db_object) {
        cb("Cannot create database file.", null);
        return;
    }


    var errors = [];

    db_object.serialize(function() {
        for (var table_name in tables) {
            var ret = getCreateTableQuery(table_name);

            // ret.sql is array in this case
            for(var id in ret.sql) {
                db_object.run(ret.sql[id], function (err) {
                    if (err) {
                        errors.push(err);
                    }
                });
            }
        }
    });


    db_object.wait(function () {
        var errStr = errors.length ? errors.join("\n") : null;
        cb(errStr, errStr ? null : db_object);
    });
};

// class for manipulating single table (table_name)
// as well as records from data_field_table and data_value_table (but related to table_name)
var Table = function (table_name) {

    var _table_name = table_name;

    // records in table_name

    this.AddNew = function (db_object, json, cb) {
        addRecord(_table_name, db_object, json, cb)
    };

    this.Get = function (db_object, json, cb) {
        getRecord(_table_name, db_object, json, cb)
    };

    this.Update = function (db_object, json, cb) {
        updateRecord(_table_name, db_object, json, cb)
    };

    this.Delete = function (db_object, json, cb) {
        deleteRecord(_table_name, db_object, json, cb)
    };

    // field rules related to table_name

    this.AddNewFieldRule = function (db_object, json, cb) {
        json = json || {};
        json.table_name = _table_name;
        addRecord(data_field_table, db_object, json, cb);
    };

    this.GetFieldRule = function (db_object, json, cb) {
        json = json || {};
        json.table_name = _table_name;
        getRecord(data_field_table, db_object, json, cb);
    };

    this.UpdateFieldRule = function (db_object, json, cb) {
        json = json || {};
        json.table_name = _table_name;
        updateRecord(data_field_table, db_object, json, cb);
    };

    this.DeleteFieldRule = function (db_object, json, cb) {
        json = json || {};
        json.table_name = _table_name;
        deleteRecord(data_field_table, db_object, json, cb);
    };

    // field values related to table_name

    this.AddNewFieldValue = function (db_object, json, cb) {
        addRecord(data_value_table, db_object, json, cb);
    };

    this.GetFieldValue = function (db_object, json, cb) {
        getRecord(data_value_table, db_object, json, cb);
    };

    this.UpdateFieldValue = function (db_object, json, cb) {
        updateRecord(data_value_table, db_object, json, cb);
    };

    this.DeleteFieldValue = function (db_object, json, cb) {
        deleteRecord(data_value_table, db_object, json, cb);
    };

    // field values related to table_name, but base on field_name rather than json object

    this.AddNewFieldValue2 = function (db_object, user_id, field_name, value, cb) {

        if (!user_id) {
            if (cb) cb("The `user_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name : _table_name }, function(err, rows) {
           if (err) {
                if (cb) cb(err);
           } else {
               if (!rows.length) {
                   if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
               } else {
                   console.log("adding record");
                   addRecord(data_value_table, db_object, { data_field_table_id : rows[0].ID, owner_table_id : user_id, value : value }, cb);
               }
           }
        });
    };

    this.GetFieldValue2 = function (db_object, user_id, field_name, cb) {

        if (!cb) {
            throw "The callback is required";
            return;
        }
        if (!user_id) {
            if (cb) cb("The `user_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name : _table_name }, function(err, rows) {
            if (err) {
                cb(err);
            } else {
                if (!rows.length) {
                    cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    getRecord(data_value_table, db_object, { data_field_table_id : rows[0].ID, owner_table_id : user_id }, function(err2, rows2) {
                        if (!err2 && rows2 && rows2.length) {
                            cb(false, rows2[0].value)
                        } else {
                            cb(false, rows[0].default_value);
                        }
                    });
                }
            }
        });
    };

    this.UpdateFieldValue2 = function (db_object, user_id, field_name, value, cb) {

        if (!user_id) {
            if (cb) cb("The `user_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name : _table_name }, function(err, rows) {
            if (err) {
                if (cb) cb(err);
            } else {
                if (!rows.length) {
                    if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    var sql = "UPDATE " + data_value_table + " SET value = '" + value + "' WHERE data_field_table_id = '" + rows[0].ID + "' AND owner_table_id = '" + user_id + "'";
                    db_object.run(sql, cb);
                }
            }
        });
    };

    this.DeleteFieldValue2 = function (db_object, user_id, field_name, cb) {

        if (!user_id) {
            if (cb) cb("The `user_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name : _table_name }, function(err, rows) {
            if (err) {
                if (cb) cb(err);
            } else {
                if (!rows.length) {
                    if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    var sql = "DELETE FROM " + data_value_table + " WHERE data_field_table_id = '" + rows[0].ID + "' AND owner_table_id = '" + user_id + "'";
                    db_object.run(sql, cb);
                }
            }
        });
    };
};


// ############  public methods

exports.Subscription = new Table(subscription_table);
exports.User = new Table(user_table);
exports.Domain = new Table(domain_table);