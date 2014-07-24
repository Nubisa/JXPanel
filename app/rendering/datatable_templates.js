/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;
var sqlite = require("./../db/sqlite.js");
var dbcache = require("./../db/dbcache.js");


var getTable = function(table_name) {
    var tableFileName = path.join(__dirname, "../definitions/datatables/" + table_name + ".js");

    if (fs.existsSync(tableFileName))
        return require(tableFileName);

    return null;
};


var getData = function(active_user, table, json, cb) {

    if (!sqlite.db) {
        cb(form_lang.Get(active_user.lang, "DBNotOpened"));
        return;
    }

    if (!active_user) {
        cb(form_lang.Get(active_user.lang, "SessionExpired"));
        return;
    }


    dbcache.refresh(function(err) {
        if (err) {
            cb(err);
            return;
        }

        var ret = dbcache.GetAll(table.settings.dbTable.table_name, json);
        if (ret.err)
            cb(ret.err)
        else {
//            console.log("getData rows", ret);
            cb(false, ret.rec);
        }
    });
};


var getForm = function(table) {

    var fname = path.join(__dirname, '../definitions/forms/' + table.settings.addForm + ".js");

    if (fs.existsSync(fname)) {
        return require(fname).form();
    }
};

var getHTML = function (active_user, table, cb) {

    var columns = table.settings.columns;
    var table_name_db = table.settings.dbTable.table_name;
    var form = getForm(table);

    if (!form) {
        cb("Cannot find form.");
        return;
    }

    // getting form control display names
    var formControls = {};
    for(var i in form.controls) {
        var ctrl = form.controls[i];
        if (ctrl.name)
            formControls[ctrl.name] = ctrl;
    }

    getData(active_user, table, null, function(err, rows) {

        if (err) {
            cb(err);
            return;
        }

        // if rows is a string, it might be some err message
        if (rows && rows.trim) {
            cb(rows);
            return;
        }

        var ret = [];
        ret.push([]);

        var dbNames = {};
        // searching for display names and dbNames of controls
        for (var a in columns) {
            var displayName = columns[a];
            if (displayName == "_checkbox") displayName = "";
            if (displayName == "_id") displayName = "ID";

            if (formControls[columns[a]] && formControls[columns[a]].details) {
                displayName = form_lang.Get(active_user.lang, formControls[columns[a]].details.label);
                dbNames[columns[a]] = formControls[columns[a]].details.dbName || columns[a];
            }

            ret[0].push(displayName);
        }

        active_user.checkHostingPlan.basicCheck();

        var cnt = 1;
        for (var y = 0, len = rows.length; y < len; y++) {

            var ID = rows[y]["ID"];
            if (!active_user.checkHostingPlan.CanSeeRecord(table_name_db, rows[y], true))
                continue;

            var single_row = [];

            if (ID === active_user.user_id)
                single_row["_class"] = "success";

            for (var x in columns) {
                var colName = dbNames[columns[x]] || columns[x];
                var val = rows[y][colName];

                val = dbcache.GetDisplayValue(colName, val);

                // null/undefined value replacement into display value
                if (formControls[columns[x]] && formControls[columns[x]].details && formControls[columns[x]].details.nullDisplayAs) {
                    if (!val && val != 0 && val !== false)
                        val = form_lang.Get(active_user.lang, formControls[columns[x]].details.nullDisplayAs) || val;
                }

                var str  = '<a href="#" onclick="jxEditRow(\''+  rows[y]["ID"] +'\'); return false;">' + val + '</a>';
                if (colName === "_checkbox")
                    str = '<input type="checkbox" id="jxrow_' + rows[y]["ID"] + '"></input>';
                else if (colName === "_id")
                    str = cnt++;

                single_row.push(str);
            }
            ret.push(single_row);
        }

        var html = exports.getDataTable(ret);
        cb(false, html);
    });
};

// each rows is array of cells
// first row is column array
// e.g.
// [
//  [ "col1", "col2", "col3" ],      // columns
//  [ "val1", val2, true ],          // row1
//  [ "val1", val2, true ]           // row2
// ]

exports.getDataTable = function(rows) {

    var cols = rows[0];

    var thead = [];
    var tbody = [];

    for(var rowID in rows) {

        if (rowID + "" === "0") {
            for(var colID in cols) {
                thead.push("<td>" + cols[colID] + "</td>")
            }
        } else {
            var _class = rows[rowID]["_class"] || "";
            if (!_class)
                tbody.push('<tr>')
            else {
                tbody.push('<tr class="' + _class +'">');
                delete rows[rowID]["_class"];
            }

            for(var colID in rows[rowID]) {
                tbody.push("<td>" + rows[rowID][colID] + "</td>");
            }
            tbody.push("</tr>");
        }
    }

    return "<thead><tr>" + thead.join("\n") + "</tr></thead>\n<tbody>" + tbody.join("\n") + "</tbody>";
};


exports.render = function (sessionId, table_name, cb) {

    var active_user = _active_user.getUser(sessionId);

    var table = getTable(table_name);
    if (!table) {
        if (cb) cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
        return;
    }

    if (!cb) {
        // sync return
        var containerFile = path.join(__dirname, "../definitions/datatables/datatable.html");
        if (fs.existsSync(containerFile)) {
            var widget = fs.readFileSync(containerFile).toString();
            logic.globals = { name: table_name, contents: "<thead><tr><td></td></tr></thead><tbody><tr><td></td></tr></tbody>", active_user: active_user, table : table};
            var result = rep(widget, logic);

            return result;
        } else {
            return form_lang.Get(active_user.lang, "UnknownDataTable");
        }
    } else {
        // async return
        getHTML(active_user, table, function(err, str) {
            cb(err, str)
        });
    }

};


var logic = [
    {from: "{{label.$$}}", to: "$$", "$": function (val, gl) {
        var active_user = gl.active_user;
        var res = form_lang.Get(active_user.lang, val);
        return !res ? "" : res;
    }
    },
    {from: "{{datatable.##}}", to: "##", "#": function (val, gl) {
        if (val == "id")
            return gl.name;

        if (val == "buttons") {
            var containerFile = path.join(__dirname, "../definitions/datatables/" + gl.name + "_buttons.html");
            if (fs.existsSync(containerFile)) {
                var txt = fs.readFileSync(containerFile).toString();
                return rep(txt, logic);
            } else
                return "";
        }

        return form_lang.Get(gl.lang, gl[val], true);
    }}
];



// removes ids from main table (e.g. user_table) and all records from data_value_table
exports.remove = function (sessionId, table_name, ids, cb) {

//    console.log("!!datatable remove", table_name, ids);

    var active_user = _active_user.getUser(sessionId);

    var table = getTable(table_name);
    if (!table) {
        cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
        return;
    }

    if (!ids) {
        cb(form_lang.Get(active_user.lang, "EmptySelection"));
        return;
    }

    if (!sqlite.db) {
        cb(form_lang.Get(active_user.lang, "DBNotOpened"));
        return;
    }

    table.settings.dbTable.Delete(sqlite.db, { "ID" : ids }, cb);
};

// called when user clicked Apply on the form
// here record info is stored in session arr and they will be available after automatic panel refresh
exports.edit = function (sessionId, table_name, id, cb) {
    var active_user = _active_user.getUser(sessionId);

    var table = getTable(table_name);
    if (!table) {
        cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
        return;
    }

    if (!id) {
        cb(form_lang.Get(active_user.lang, "EmptySelection"));
        return;
    }

    getData(active_user, table, { ID : id }, function(err, rows) {
        if (!err) {

            if (rows.length > 0) {

                //remembering display name of ID values
                for(var field_name in rows[0]) {
                    var val = rows[0][field_name];
                    var display_name = dbcache.GetDisplayValue(field_name, val);
                    if (display_name !== val)
                        rows[0][field_name + "|display"] = display_name;
                }

                active_user.session.edits = active_user.session.edits || {};
                active_user.session.edits[table.settings.addForm] = rows[0];

//                    console.log("storing rows in edits", rows);

                // sending url to the browser for redirecting to edit form
                active_user.session.lastPath = "/" + table.settings.addFormURL;
                cb(false, table.settings.addFormURL);
            } else {
                cb(form_lang.Get(active_user.lang, "EmptySelection"));
            }

        } else {
            cb(err);
        }
    });

};