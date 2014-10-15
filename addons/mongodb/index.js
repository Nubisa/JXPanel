/**
 * Created by root on 10/1/14.
 */

var fs = require("fs");
var path = require("path");
var db = require("./db");
var shell = require("./shell");


var getConfigForm = function(addonFactory, status) {

    var form = addonFactory.form.new("mongo_form_config", { onSubmitSuccess : addonFactory.url.addon, onSubmitCancel : addonFactory.url.addon} );
    form.allowEmpty = true;
    form.addSection("MongoDB Engine");
    form.addControl("simpleText", "txt1", { label : "Status", value : status.html, required : true });

    var btn = null;
    if (!status.installed)
        var btn = addonFactory.html.getServerButton("Install", "mongoInstall");
    else
    if (status.installed && !status.online)
        var btn = addonFactory.html.getServerButton("Start", "mongoStartStop", "start");
    else if (status.online)
        var btn = addonFactory.html.getServerButton("Stop", "mongoStartStop", "stop");

    if (btn)
        form.addControl("simpleText", "txt2", { label : "Operation", value : btn, required : true });

//    form.addControl("text", "txt2", { label : "my txt2", default : "some value 2" });
//    form.addSection("Others");
//    form.addControl("checkbox", "chk1", { label : "my chk1", default : 1 });
//    form.addControl("combobox", "chk11", { label : "my combo1", default : 2, values : [1,2,3] });

    form.on('submit', function(values, cb) {
        console.log("values from form", values);
        addonFactory.db.set("initialized", true) ;
        cb(true);
    });

    return form;
};


// this is addon's response on url: addon.html?addon_name
// should return html, which will be displayed in main frame
exports.request = function(env, args, cb) {

    var addonFactory = jxpanel.getAddonFactory(env);

    if (!db.port) {
        db.port = addonFactory.db.get("port") || 27027;  // mongodb has default 27017, let's not interfere with it
    }

    var html = "";

    var initialized = addonFactory.db.get("initialized");

    var status = shell.mongoStatus(addonFactory);
    if (addonFactory.activeUser.isAdmin) {
        if (!initialized || args.tab === "config" || !status.installed) {
            args.tab = "config";
            html = getConfigForm(addonFactory, status).render();
        }
    } else {
        if (!status.installed) {
            cb(false, "MongoDB engine is not installed.")
            return;
        }
    }

    if (!args.tab || args.tab === "databases") {
        // constructing a table
        var table = [];
        var columns = ["", "ID", "name", "value1", "value2"];
        table.push(columns);

        addonFactory.header.addServerButton("Add database", "addDB");
        addonFactory.header.addServerButton("Remove database", "removeDB", null, true);
        addonFactory.header.addClientButton("Go to the form", "goToTheForm(); return false;");

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

    if (addonFactory.activeUser.isAdmin)
        tabs.push({id: "config", label: "Configuration"});

    addonFactory.tabs.create("osiem", tabs);

    // returning html
    cb(false, addonFactory.render(html));
};

jxpanel.server.addJSMethod("addDB", function(env, params) {

    db.AddDB(env, null, function(err) {
        jxpanel.server.sendCallBack(env, {err : err } );
    });
});


jxpanel.server.addJSMethod("removeDB", function(env, params) {

    db.RemoveDB(params.op.selection, function(err) {
        jxpanel.server.sendCallBack(env, {err : err } );
    });
});


jxpanel.server.addJSMethod("mongoStartStop", function(env, params) {

    var addonFactory = jxpanel.getAddonFactory(env);


    if (params.op === "start" || params.op === "stop")
        var res = shell.mongoStartStop(params.op);
    else
        var res = { err : "UnknownCommand|: " + params.op };

    if (res.err) {
        res.err = addonFactory.translate(res.err);
    }
    jxpanel.server.sendCallBack(env, {err : res.err } );
});


jxpanel.server.addJSMethod("mongoInstall", function(env, params) {

    var addonFactory = jxpanel.getAddonFactory(env);

    shell.mongoInstall(addonFactory, function(err) {
        if (err)
            err = addonFactory.translate(err);
        addonFactory.status.clear();
        jxpanel.server.sendCallBack(env, {err : err } );
    });
});