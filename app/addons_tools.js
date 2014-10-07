/**
 * Created by root on 10/1/14.
 */


var database = require("./install/database");
var site_defaults = require("./definitions/site_defaults");
var form_lang = require("./definitions/form_lang");
var _active_user = require("./definitions/active_user");
var path = require("path");
var fs = require("fs");
var exec = require('child_process').exec;
var https = require("https");
var user_folders = require("./definitions/user_folders");
var system_tools = require("./system_tools");
var nginx = require("./install/nginx");
var apps_tools = require("./rendering/apps_tools");
var datatables = require("./rendering/datatable_templates");
var page_utils = require("./rendering/page_utils");
var server = require("jxm");
var smart_replace = require('./rendering/smart_search').replace;


var checkUpacked = function (addon_dir) {

    if (!fs.existsSync(addon_dir))
        return { err: "AddOnUnknown" };

    var json_path = path.join(addon_dir, "package.json");
    if (!fs.existsSync(addon_dir))
        return { err: "AddOnPackageJsonAbsent" };

    var json_str = fs.readFileSync(json_path).toString();

    try {
        var json = JSON.parse(json_str);
    } catch (ex) {
        return { err: "AddOnPackageJsonCannotParse" };
    }

    if (!json.id)
        return { err: "AddOnPackageJsonNoID" };

    if (!json.name)
        return { err: "AddOnPackageJsonNoName" };

    var reg = /[^0-9A-Za-z_]/;

    if (json.id.match(reg) !== null)
        return { err: "AddOnPackageJsonInvalidID" };

    var index_path = path.join(addon_dir, "index.js");
    if (!fs.existsSync(addon_dir))
        return { err: "AddOnIndexAbsent" };

    try {
        var addon = require(index_path);
    } catch (ex) {
        return { err: "AddOnIndexCannotRequire" };
    }

    if (typeof addon.request !== 'function')
        return { err: "AddOnIndexNoMember|request"}

    return { json: json, addon: addon};
};

var unload = function (active_user, addon_name) {

    if (active_user.session.addons) {
        delete active_user.session.addons[addon_name];
    }
    var index_path = path.join(site_defaults.dirAddons, addon_name, "index.js");
    delete require.cache[index_path];

    copy();
};

var copy = function () {
    // temporarily copies addons to server_apps folder
    var cmd = "cp -rf " + path.join(site_defaults.apps_folder, "../addons") + " " + site_defaults.apps_folder + path.sep;
    jxcore.utils.cmdSync(cmd);
};

var getContents = function (env, active_user, cb) {

    // e.g. /addonm.html/mongodb/id/1/par/2
    var parsed = active_user.session.lastUrl.split("?");
    // [0] = addonm.html
    // [1] = mongodb (addon id)
    // [2] = 1st param name
    // [3] = 1st param value
    // [4] = 2nd param name
    // [5] = 2nd param value
    var addon_name = parsed[1] || "";

    if (!addon_name) {
        cb({ err: "AddOnUnknown" });
        return;
    }

    unload(active_user, addon_name);

    if (!active_user.session.addons)
        active_user.session.addons = {};

    if (!active_user.session.addons[addon_name]) {
        // loading addon
        var addon_dir = path.join(site_defaults.dirAddons, addon_name);
        var res = checkUpacked(addon_dir);
        if (res.err) {
            cb(res.err);
            return res;
        }
        active_user.session.addons[res.json.id] = res.addon;
    }

    var addon = active_user.session.addons[addon_name];

    var wasError = false;
    try {
        addon.request(env, function (err, html) {
            if (!wasError) {

                html = active_user.session.addon_factory.header.renderButtons()
                     + "<h1>" + res.json.title + "</h1>"
                     + html;
                cb(err, html);
            }
        });
    } catch (ex) {
        wasError = true;
        cb(ex.toString(), ex.toString());
    }
};

exports.defineMethods = function () {

    server.addJSMethod("getAddon", function (env, params) {
        var active_user = _active_user.getUser(env.SessionID);
        if (!active_user) {
            server.sendCallBack(env, {err: form_lang.Get("EN", "Access Denied"), relogin: true});
            return;
        }

        getContents(env, active_user, function (err, html) {
            if (err) err = form_lang.Get(active_user.lang, err, true)
            server.sendCallBack(env, { err: err, html: html });
        });
    });

    copy();
};


var smart_rule = [
    {from: "{{label.$$}}", to: "$$", "$": function (val, gl) {
        var res = form_lang.Get(gl.lang, val);
        return !res ? "" : res;
    }
    }
];


var extension_class = function (env, active_user) {

    var __env = env;
    var __active_user = active_user;

    var buttons = [];

    this.table = {
        render: function (arr) {
            return datatables.getDataTable(arr) + datatables.getClientTableScript() + '<script type="text/javascript">refreshtable();</script>';
        }
    };

    this.header = {
        addClientButton: function (caption, onclick_name, args) {
            var onclick = onclick_name + "(" + (JSON.stringify(args) || "").replace(/"/g, "'") + "); return false";
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, false);
            buttons.push(btn);
        },
        addServerButton: function (caption, method_name, args, addSelection) {
            var _name = addSelection ? "utils.jxCallSelection" : "utils.jxCall";

            var onclick = _name + "('" + method_name +"', " + (JSON.stringify(args) || "{}").replace(/"/g, "'") + "); return false";
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, false);
            buttons.push(btn);
        },
        renderButtons: function () {
            if (!buttons.length)
                return "";

            var html = '<div style="margin-left:-6px;margin-top:0px;">' +
                '<span id="buttons" class="jxbuttons">' +
                '<i class="fa fa-fw fa-align-justify" style="color: #757a7b;"></i>&nbsp;&nbsp;' +
                '{{datatable.buttons}}' +
                '</span>' +
                '</div>';

            var str = "";
            for (var a in buttons)
                str += buttons[a];

            return html.replace("{{datatable.buttons}}", str);
        }
    };

    this.db = {
        getUser : function(user_name) {
            if (!user_name)
                user_name = __active_user.username;
            var user = database.getUser(user_name);
            // returning copy of the user object
            return JSON.parse(JSON.stringify(user));
        },
        getUserData : function(user_name) {
            if (!user_name)
                user_name = __active_user.username;
            var user = database.getUser(user_name);
            // returning copy of the user object
            var copy = JSON.parse(JSON.stringify(user));
            return copy.data || {};
        },
        updateUserData : function(user_name, data) {
            if (!user_name)
                user_name = __active_user.username;

            var user = database.getUser(user_name);
            user.data = JSON.parse(JSON.stringify(data));
            database.updateUser(user_name, user);
        }
    };
    var _db = this.db;

    this.render = function (html) {
        smart_rule.globals = {"sessionId":__env.sessionId, "active_user": __active_user, "lang":__active_user.lang  };
        return smart_replace(html, smart_rule);
    };

    this.activeUser = this.db.getUser();
};

global.jxpanel = {
    getAddonFactory: function (env) {
        var active_user = _active_user.getUser(env.SessionID);
        if (!active_user) {
            return {err: form_lang.Get("EN", "Access Denied") };
        }

        //if (!active_user.session.addon_factory)
        active_user.session.addon_factory = new extension_class(env, active_user);

        return active_user.session.addon_factory;
    },
    server: require("jxm")
};