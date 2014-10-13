/**
 * Created by root on 10/1/14.
 */

var fs = require("fs");
var path = require("path");
var db = require("./db");


// this is addon's response on url: addon.html?addon_name
// should return html, which will be displayed in main frame
exports.request = function(env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var html = "";

    if (!args.tab || args.tab === "databases") {
        // constructing a table
        var table = [];
        var columns = ["", "ID", "name", "value1", "value2"];
        table.push(columns);

        addonFactory.header.addServerButton("Add database", "addDB");
        addonFactory.header.addServerButton("Remove database", "removeDB", null, true);
        addonFactory.header.addClientButton("Go to the form", "goToTheForm");

        var dbs = addonFactory.db.get("dbs") || {};

        var id = 1;
        for(var a in dbs) {
            if (a === "__id") continue;

            var chk = '<input type="checkbox" id="jxrow_' + a + '"></input>';
            table.push([chk, id, a, "", "" ]);
            id++;
        }

        html = addonFactory.table.render(table);
    }

    if (args.tab === "form") {
        addonFactory.header.addServerButton("Some button", "");

        var form = addonFactory.form.new("my_form");
        form.addSection("Text boxes");
        form.addControl("text", "txt1", { label : "my txt1", default : "some value", required : true });
        form.addControl("text", "txt2", { label : "my txt2", default : "some value 2" });
        form.addSection("Others");
        form.addControl("checkbox", "chk1", { label : "my chk1", default : 1 });
        form.addControl("combobox", "chk11", { label : "my combo1", default : 2, values : [1,2,3] });

        form.on('submit', function(values, cb) {
            console.log("values from form", values);
            cb(true);
        });

        html = form.render();
    }

    var tabs = [
        {id: "databases", label: "Databases", icon : '<img id="dashboard_img" class="menu-icon" src="icons/dashboard.png">'},
        {id: "form", label: "Sample Addon's Form"},
        {id: "tab3", label: "Empty Tab"}
    ];

    addonFactory.tabs.create("osiem", tabs);

    // returning html
    cb(false, addonFactory.render(html));
};

jxpanel.server.addJSMethod("addDB", function(env, params) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var dbs = addonFactory.db.get("dbs") || { __id : 0 };

    var new_name = addonFactory.activeUser.name + "#" + (dbs.__id + 1);
    dbs[new_name] = true;
    dbs.__id++;

    addonFactory.db.set("dbs", dbs);
    jxpanel.server.sendCallBack(env, {err : false } );
});


jxpanel.server.addJSMethod("removeDB", function(env, params) {

    //console.log(params);

    var addonFactory = jxpanel.getAddonFactory(env);

    var dbs = addonFactory.db.get("dbs");

    if (dbs) {
        for(var a in params.op.selection) {
            var db_name = params.op.selection[a];
            delete dbs[db_name];
        }

        addonFactory.db.set("dbs", dbs);
    }

    jxpanel.server.sendCallBack(env, {err : false } );
});


