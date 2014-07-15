/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var fs = require("fs");
var path = require("path");
var rep = require('./smart_search').replace;


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


exports.render = function (sessionId, tableName) {

    var tableFileName = path.join(__dirname, "../definitions/datatables/" + tableName + ".js");

    if (!fs.existsSync(tableFileName)) {
        return "Unknown table";
    }

    var active_user = _active_user.getUser(sessionId);

    var table = require(tableFileName);

    var containerFile = path.join(__dirname, "../definitions/datatables/datatable.html");
    if (fs.existsSync(containerFile)) {
        var widget = fs.readFileSync(containerFile).toString();
        logic.globals = { name: tableName, contents: table.getData(), active_user: active_user};
        var result = rep(widget, logic);

        return result;
    } else {
        return fstr;
    }
};