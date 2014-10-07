/**
 * Created by root on 10/1/14.
 */

var fs = require("fs");
var path = require("path");
var db = require("./db");


// this is addon's response on url: addon.html?addon_name
// should return html, which will be displayed in main frame
exports.request = function(env, cb) {

    // constructing a table
    var table = [];
    var columns = ["", "ID", "name", "value1", "value2"];
    table.push(columns);

    var addonFactory = jxpanel.getAddonFactory(env);
    addonFactory.header.addServerButton("Add database", "addDB");
    addonFactory.header.addServerButton("Remove databse", "removeDB", null, true);

    var userData = getUserData(addonFactory);
    var dbs = userData.mongo.dbs;

    var id = 1;
    for(var a in dbs) {
        if (a === "length") continue;

        var chk = '<input type="checkbox" id="jxrow_' + a + '"></input>';
        table.push([chk, id, a, "", "" ]);
        id++;
    }

    var str = addonFactory.table.render(table);
    var index = fs.readFileSync( path.join(__dirname,"./index.html")).toString();
    index = index.replace("{{table}}", str);

    // returning html
    cb(false, addonFactory.render(index));
};

var getUserData = function(addonFactory) {
    var userData = addonFactory.db.getUserData();

    userData.mongo = userData.mongo || {};
    userData.mongo.dbs = userData.mongo.dbs || {};

    if (JSON.stringify(userData.mongo.dbs).slice(0,1) === "[")
        userData.mongo.dbs = {};

    if (typeof userData.mongo.dbs.length === "undefined")
        userData.mongo.dbs.length = 0;

    return userData;
};


jxpanel.server.addJSMethod("addDB", function(env, params) {

    var addonFactory = jxpanel.getAddonFactory(env);

    var user = addonFactory.activeUser;
    var userData = getUserData(addonFactory);
    var dbs = userData.mongo.dbs;

    var new_name = user.name + "#" + (dbs.length + 1);
    dbs[new_name] = true;
    dbs.length++;

    addonFactory.db.updateUserData(user.name, userData);

    jxpanel.server.sendCallBack(env, {err : false } );
});


jxpanel.server.addJSMethod("removeDB", function(env, params) {

    console.log(params);

    var addonFactory = jxpanel.getAddonFactory(env);

    var userData = getUserData(addonFactory);
    var dbs = userData.mongo.dbs;

    for(var a in params.op.selection) {
        var db_name = params.op.selection[a];
        delete dbs[db_name];
    }

    var user = addonFactory.activeUser;
    addonFactory.db.updateUserData(user.name, userData);

    jxpanel.server.sendCallBack(env, {err : false } );
});