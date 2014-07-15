/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;


var getHTML = function (active_user, tableName, cb) {

    var tableFileName = path.join(__dirname, "../definitions/datatables/" + tableName + ".js");

    if (!fs.existsSync(tableFileName)) {
        cb(form_lang.Get(active_user.lang, "UnknownDataTable"));
        returnl
    }

    var table = require(tableFileName);

    var columns = table.columns;
    table.getData(active_user, function(err, rows) {

        if (err) {
            cb(err);
            return;
        }

        if (rows && rows.trim) {
            cb(rows);
            return;
        }

        var thead = [];
        var tbody = [];
        for (var a in columns) {
            thead.push("<td>" + columns[a] + "</td>")
        }

        for (var y = 0, len = rows.length; y < len; y++) {
            tbody.push("<tr>");
            for (var x in columns) {
                tbody.push("<td>" + rows[y][x] + "</td>");
            }
            tbody.push("</tr>");
        }

        cb(false, "<thead><tr>" + thead.join("\n") + "</tr></thead>\n<tbody>" + tbody.join("\n") + "</tbody>");

    });
};

exports.render = function (sessionId, tableName, cb) {

    var active_user = _active_user.getUser(sessionId);

    if (!cb) {
        // sync return
        var containerFile = path.join(__dirname, "../definitions/datatables/datatable.html");
        if (fs.existsSync(containerFile)) {
            var widget = fs.readFileSync(containerFile).toString();
            logic.globals = { name: tableName, contents: "<thead><tr><td></td></tr></thead><tbody><tr><td></td></tr></tbody>", active_user: active_user};
            var result = rep(widget, logic);

            return result;
        } else {
            return form_lang.Get(active_user.lang, "UnknownDataTable");
        }
    } else {
        // async return
        getHTML(active_user, tableName, function(err, str) {
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

        return form_lang.Get(gl.lang, gl[val], true);
    }}
];
