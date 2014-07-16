/**
 * Created by Nubisa Inc. on 7/9/14.
 */


var sqlite3 = require('sqlite3');
var fs = require('fs');
var util = require("util");

var counter = 1;

// ########## table names

var subscription_table = "subscription_table";
var plan_table = "plan_table";
var user_table = "user_table";
var domain_table = "domain_table";

var data_field_table = "data_field_table";
var data_value_table = "data_value_table";


// ########## table definitions

var tables = {};
tables[subscription_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true },
        "subscription_name": { type: "TEXT", required: true, unique: true},
        "owner_user_ids": { type: "TEXT" }
    }
};

tables[plan_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true },
        "plan_name": { type: "TEXT", required: true, unique: true}
    },
    view : {
        name : "vPlans"
    }
};


tables[user_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true},
        "subscription_table_id": { type: "CHAR(20)", required: false },
        "username": { type: "TEXT", required: true, unique: true},
        "password": { type: "TEXT", required: true }
    },
    view : {
        name : "vUsers"
    }
};

tables[domain_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true },
        "subscription_table_id": { type: "CHAR(20)", required: true },
        "domain_name": { type: "TEXT", required: true, unique: true }
    },
    view : {
        name : "vDomains"
    }
};

tables[data_field_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true },
        "table_name": { type: "TEXT", required: true, unique1: true },
        "field_name": { type: "TEXT", required: true, unique1: true },
        "field_type": { type: "TEXT"},
        "default_value_rules": { type: "TEXT"},
        "default_value": { type: "TEXT"}
    }
};

tables[data_value_table] = {
    fields : {
        "ID": { type: "CHAR(20)", required: true, primary: true},
        "data_field_table_id": { type: "CHAR(20)", required: true, unique1: true },
        "owner_table_id": { type: "INTEGER", required: true, unique1: true },
        "value": { type: "TEXT" }
    }
};




// ########## private methods


// generates sql query for creating table, with indexes
var getCreateTableQuery = function (table_name) {
    var ret = { err: false, sql: "" };

    var columns = [];
    var unique = [];
    var uniques = {};
    var sql = [];

    for (var field_name in tables[table_name].fields) {
        var field = tables[table_name].fields[field_name];
        if (field.unique1) {
            if (!uniques[table_name]) uniques[table_name] = [];
            uniques[table_name].push(field_name);
        }
    }

    for (var field_name in tables[table_name].fields) {
        var field = tables[table_name].fields[field_name];
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


var getCreateViewQuery = function (view_name, table_name) {

    var sql = "CREATE VIEW " + view_name + " AS "
        + "SELECT * FROM data_value_table v JOIN data_field_table f ON v.data_field_table_id = f.ID "
        + "WHERE f.table_name = '" + table_name + "' AND v.owner_table_id in "
        + "(SELECT ID FROM " + table_name + ")";

    return sql;
};


// return err string or null if field value is ok
var checkFieldValue = function (table_name, field_name, json) {

    var fieldDef = tables[table_name].fields[field_name];

    if (!fieldDef) {
        return "Field `" + field_name + "` does not exist in table " + table_name;
    }

    return null;
};


// return err string or null if fields are ok
var checkRequiredFields = function (table_name, json) {
    var fields = tables[table_name].fields;

    for (var field_name in fields) {
        var fieldDef = fields[field_name];
        if (fieldDef.required && !json[field_name]) {
            return "Field `" + field_name + "` is required for table `" + table_name + "`.";
        }
    }
    return null;
};


var getIfNotExistsQuery = function(table_name) {
    var ret = { err: false, sql: "" };


    var uniques = [];

    for (var field_name in tables[table_name].fields) {
        var field = tables[table_name].fields[field_name];
        if (field.unique1) {
            uniques[table_name].push(field_name);
        }
    }
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
    ret.ID = json.ID;
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
        if (util.isArray(json_where[field])) {
            where.push(field + " IN ('" + json_where[field].join("', '") + "')");
        } else {
            where.push(field + " = '" + json_where[field] + "'");
        }
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
        db_object.run(ret.sql, function (err) {
            if (cb) cb(err, ret.ID);
        });
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


// class for manipulating single table (table_name)
// as well as records from data_field_table and data_value_table (but related to table_name)
var Table = function (table_name) {

    var _table_name = table_name;
    var isCommon = table_name == data_field_table || table_name == data_value_table;

    // records in table_name

    this.AddNew = function (db_object, json, cb) {
        addRecord(_table_name, db_object, json, cb)
    };

    this.Get = function (db_object, json, cb) {
        getRecord(_table_name, db_object, json, cb)
    };


    this.GetAll = function (db_object, json, cb) {

        if (!cb) {
            throw "The callback is required";
            return;
        }

        // getting the main table first
        getRecord(_table_name, db_object, json, function(err, rows) {
            if (err) {
                cb(err);
            } else {

//                console.log("rows", rows);

                var ids = [];
                for(var a in rows) {
                    ids.push(rows[a].ID)
                }

                var sql = "SELECT * FROM data_value_table v JOIN data_field_table f ON v.data_field_table_id = f.ID "
                    + "WHERE f.table_name = '" + _table_name + "' AND v.owner_table_id IN ('"+ ids.join("', '") +"')";

                db_object.all(sql, function(err1, rows1) {
                    if (err1) {
                        cb(err1);
                    } else {
//                        console.log("subrows", rows1);

                        for (var b in rows) {
                            var id = rows[b].ID;
                            for (var a in rows1) {
                                var id1 = rows1[a].owner_table_id;

                                if (id == id1) {
//                                    console.log("OK", id, id1, rows1[a].field_name,rows1[a].value )
                                    var fieldName = rows1[a].field_name;

                                    if (!rows[b][fieldName])
                                        rows[b][fieldName] = rows1[a].value;
                                }
                            }
                        }


                        cb(false, rows);
                    }
                });
            }
        });
    };


    this.Update = function (db_object, json, cb) {
        updateRecord(_table_name, db_object, json, cb)
    };

    this.Delete = function (db_object, json, cb) {

        if (isCommon) {
            deleteRecord(_table_name, db_object, json, cb);
        } else {
            // this will work properly only if json.ID is present, and this can be array
            deleteRecord(_table_name, db_object, json, function(err) {
                if (err) {
                    if (cb) cb(err);
                } else {
                    deleteRecord(data_value_table, db_object, { owner_table_id : json.ID }, cb);
                };
            });
        }
    };

    // field rules related to table_name (data_field_table)

    this.AddNewFieldRule = function (db_object, json, cb) {
        json = json || {};
        json.table_name = _table_name;
        addRecord(data_field_table, db_object, json, cb);
    };

    // each item in field arr is json containing one field definition (row of data_field_table)
    this.AddNewFieldRules = function(db_object, fieldsArr, cb) {

        var errors = [];
        var _cb = function(err) {
            if (err) errors.push(err);
        };

        db_object.serialize( function() {
            for(var id in fieldsArr) {
                var field = fieldsArr[id];
                field.table_name = _table_name;
                var ret = getInsertQuery(data_field_table, field);
                if (ret.err) {
                    if (cb) cb(ret.err);
                    return;
                }
                db_object.run(ret.sql, _cb);
            }
        });

        db_object.wait(function () {
            var errStr = errors.length ? errors.join("\n") : null;
            cb(errStr);
        });
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

    // field values related to table_name (data_value_table)

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

    // field values related to table_name (data_value_table), but based on field_name rather than json object

    this.AddNewFieldValue2 = function (db_object, owner_table_id, field_name, value, cb) {

        if (!owner_table_id) {
            if (cb) cb("The `owner_table_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name: _table_name }, function (err, rows) {
            if (err) {
                if (cb) cb(err);
            } else {
                if (!rows.length) {
                    if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    addRecord(data_value_table, db_object, { data_field_table_id: rows[0].ID, owner_table_id: owner_table_id, value: value }, cb);
                }
            }
        });
    };

    this.GetFieldValue2 = function (db_object, owner_table_id, field_name, cb) {

        if (!cb) {
            throw "The callback is required";
            return;
        }
        if (!owner_table_id) {
            if (cb) cb("The `owner_table_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name: _table_name }, function (err, rows) {
            if (err) {
                cb(err);
            } else {
                if (!rows.length) {
                    cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    getRecord(data_value_table, db_object, { data_field_table_id: rows[0].ID, owner_table_id: owner_table_id }, function (err2, rows2) {
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

    this.UpdateFieldValue2 = function (db_object, owner_table_id, field_name, value, cb) {

        if (!owner_table_id) {
            if (cb) cb("The `owner_table_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name: _table_name }, function (err, rows) {
            if (err) {
                if (cb) cb(err);
            } else {
                if (!rows.length) {
                    if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    var sql = "UPDATE " + data_value_table + " SET value = '" + value + "' WHERE data_field_table_id = '" + rows[0].ID + "' AND owner_table_id = '" + owner_table_id + "'";
                    db_object.run(sql, cb);
                }
            }
        });
    };

    this.DeleteFieldValue2 = function (db_object, owner_table_id, field_name, cb) {

        if (!owner_table_id) {
            if (cb) cb("The `owner_table_id` field must be provided.");
            return;
        }
        if (!field_name) {
            if (cb) cb("The `field_name` field must be provided.");
            return;
        }

        getRecord(data_field_table, db_object, { field_name: field_name, table_name: _table_name }, function (err, rows) {
            if (err) {
                if (cb) cb(err);
            } else {
                if (!rows.length) {
                    if (cb) cb("Field `" + field_name + "` definition for table `" + _table_name + "` was not found.");
                } else {
                    var sql = "DELETE FROM " + data_value_table + " WHERE data_field_table_id = '" + rows[0].ID + "' AND owner_table_id = '" + owner_table_id + "'";
                    db_object.run(sql, cb);
                }
            }
        });
    };

};


// ############  public methods

exports.Subscription = new Table(subscription_table);
exports.Plan = new Table(plan_table);
exports.User = new Table(user_table);
exports.Domain = new Table(domain_table);



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

    var _cb = function (err) {
        if (err) {
            errors.push(err);
        }
    };

    var errors = [];

    db_object.serialize(function () {
        // creating tables
        for (var table_name in tables) {
            var ret = getCreateTableQuery(table_name);

            // ret.sql is array in this case
            for (var id in ret.sql) {
                db_object.run(ret.sql[id], _cb);
            }
        }

        // creating views
        for (var table_name in tables) {
            if (tables[table_name].view) {
                db_object.run(getCreateViewQuery(tables[table_name].view.name, table_name), _cb);
            }
        }
    });


    db_object.wait(function () {
        var errStr = errors.length ? errors.join("\n") : null;
        cb(errStr, errStr ? null : db_object);
    });
};



// just for now

exports.db = null;

exports.CreateDatabase( __dirname + "/dbfile.db", function (err, db) {
    if (!err) {
        exports.db = db;
    } else {
        console.log("SQLITE, create database err", err);
    }
});



