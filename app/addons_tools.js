/**
 * Created by root on 10/1/14.
 */


var database = require("./install/database");
var site_defaults = require("./definitions/site_defaults");
var form_lang = require("./definitions/form_lang");
var _active_user = require("./definitions/active_user");
var path = require("path");
var fs = require("fs");
var url = require("url");
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
var tools = require('./rendering/form_tools');
var form_templates = require('./rendering/form_templates');
var events = require("events");

var addons = {};

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
        var index = require(index_path);
    } catch (ex) {
        console.error(ex);
        return { err: "AddOnIndexCannotRequire" };
    }

    if (typeof index.request !== 'function')
        return { err: "AddOnIndexNoMember|request"}

    // events.js is optional
    var events_path = path.join(addon_dir, "events.js");
    var events = null;
    if (fs.existsSync(events_path)) {
        try {
            events = require(events_path);
        } catch (ex) {
            // invalid file
            return { err : "AddOnEventsCannotRequire" };
        }
    }

    return { json: json, index: index, events : events, id :json.id, dir : addon_dir };
};

var unload = function (addon_name) {

    delete addons[addon_name];
    var index_path = path.join(site_defaults.dirAddons, addon_name, "index.js");
    delete require.cache[index_path];
};


var load = function(addon_name) {

    copy();

    if (!addons[addon_name]) {
        // loading addon
        var addon_dir = path.join(site_defaults.dirAddons, addon_name);
        var res = checkUpacked(addon_dir);
        if (res.err) {
            return res;
        }
        addons[addon_name] = res;
    }

    return addons[addon_name];
};

var copy = function () {
    // temporarily copies addons to server_apps folder
    var cmd = "cp -rf " + path.join(site_defaults.apps_folder, "../addons") + " " + site_defaults.apps_folder + path.sep;
    jxcore.utils.cmdSync(cmd);
};

var getContents = function (env, active_user, cb) {

    // e.g. /addonm.html?mongodb&id=1&par=2
    var tmp = active_user.session.lastUrl.replace(new RegExp("&", "g"), "?").split("?");
    var addon_name = tmp[1] || "";

    // [0] = addonm.html
    // [1] = mongodb (addon id)
    // [2] = 1st param name
    // [3] = 1st param value
    // [4] = 2nd param name
    // [5] = 2nd param value

    var parsedUrl = url.parse(active_user.session.lastUrl, true);
    var addon_args = parsedUrl.query;

    if (!addon_name) {
        cb({ err: "AddOnUnknown" });
        return;
    }

    // just for development process
    unload(addon_name);

    var addon = load(addon_name);
    if (addon.err) {
        cb( { err : addon.err });
        return;
    }

    active_user.session.addonCurrent = { instance : addon, args : addon_args };

    var wasError = false;
    try {
        active_user.session.addonCurrent.instance.index.request(env, addon_args, function (err, html) {
            if (!wasError) {
                cb(err, html);
            }
        });
    } catch (ex) {
        wasError = true;
        cb(ex.toString(), ex.toString());
    }
};

exports.defineMethods = function () {

    // this method gets called by addon.html with addon name after ?, e.g.:
    // addon.html?mongodb
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
    },
    {from: "{{form.$$}}", to: "$$", "$": function (val, gl) {
        return gl.form[val];
    }
    }
];


var extension_class = function (env, active_user, addonCurrent) {

    var __env = env;
    var __active_user = active_user;
    var __this = this;
    var __addon = addonCurrent;

    var __buttons = [];
    var __tabs = {};

    this.table = {
        render: function (arr) {
            return datatables.getDataTable(arr) + datatables.getClientTableScript() + '<script type="text/javascript">refreshtable();</script>';
        }
    };

    this.form = {
        new : function(id, options) {
            return new form(id, __env, __active_user, options, __this)
        }
    };

    this.tabs = {
        create: function (id, tabs) {

            var str = '<ul id="' + id + '" class="nav nav-tabs bordered">';

            var currentTab = __addon.args.tab || null;
            var url = "/addon.html?" + __addon.instance.id + "&tab=";

            for (var a in tabs) {
                var tab = tabs[a];
                if (!currentTab) currentTab = tab.id; // first tab will be active, if no other tab is specified
                if (currentTab === tab.id)
                    str += '<li class="active" id="' + tab.id + '">';
                else
                    str += '<li id="' + tab.id + '">';

                var icon = tab.icon || '<i class="fa fa-lg fa-gear">';
                str += '<a href="' + url + tab.id + '">' + icon + '</i> ' + tab.label + '</a></li>';
            }

            str += '</ul>';

            __tabs.html = str;
            __tabs.current = currentTab;
            return str;
        }
    };

    this.header = {
        addClientButton: function (caption, onclick_name, args) {
            var onclick = onclick_name + "(" + (JSON.stringify(args) || "").replace(/"/g, "'") + "); return false";
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, false);
            __buttons.push(btn);
        },
        addServerButton: function (caption, method_name, args, addSelection) {
            var _name = addSelection ? "utils.jxCallSelection" : "utils.jxCall";

            var onclick = _name + "('" + method_name +"', " + (JSON.stringify(args) || "{}").replace(/"/g, "'") + "); return false";
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, false);
            __buttons.push(btn);
        },
        renderButtons: function () {
            if (!__buttons.length)
                return "";

            var html = '<div style="margin-left:-6px;margin-top:0px;">' +
                '<span id="buttons" class="jxbuttons">' +
                '<i class="fa fa-fw fa-align-justify" style="color: #757a7b;"></i>&nbsp;&nbsp;' +
                '{{datatable.buttons}}' +
                '</span>' +
                '</div>';

            var str = "";
            for (var a in __buttons)
                str += __buttons[a];

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
        },
        get : function(sid) {
            var user = database.getUser(__active_user.username);
            if (user && user.addons && user.addons[__addon.instance.id]) {
                return user.addons[__addon.instance.id][sid];
            }

            return null;
        },
        set : function(sid, value) {
            var user = database.getUser(__active_user.username);
            if (!user.addons) user.addons = {};
            if (!user.addons[__addon.instance.id]) user.addons[__addon.instance.id] = {};
            user.addons[__addon.instance.id][sid] = value;
            database.updateUser(user.name, user);
        },
        remove : function(sid) {
            var user = database.getUser(__active_user.username);
            if (user && user.addons && user.addons[__addon.instance.id]) {
                delete user.addons[__addon.instance.id][sid];
            }
            database.updateUser(user.name, user);
        }
    };

    this.render = function (html) {
        smart_rule.globals = {"sessionId":__env.sessionId, "active_user": __active_user, "lang":__active_user.lang  };
        html = smart_replace(html, smart_rule);

        var file = "";
        var file_name = path.join(site_defaults.dirAddons, __addon.instance.id, __tabs.current + ".html");
        if (fs.existsSync(file_name)) {
            file = fs.readFileSync(file_name).toString();
        }

        if (__tabs.html) {
            html = __tabs.html
                 + '<div id="myTabContent1" class="tab-content padding-10"><div class="tab-pane fade in active">'
                 + html
                 + '</div>';
        }

        if (file.indexOf("{{contents}}") !== -1)
            html = file.replace("{{contents}}", html);
        else
            html = file + html;

        return __this.header.renderButtons() + "<br><h1>" + __addon.instance.json.title + "</h1>" + html;
    };

    this.activeUser = this.db.getUser();

};


var form = function(id, env, active_user, options, factory) {

    if (!options) options = {};

    var __env = env;
    var __active_user = active_user;
    var __this = this;
    var __factory = factory;

    var section_started = false;
    var controls = [];
    var ids = [];

    this.onSubmitSuccess = options.onSubmitSuccess || "addonm.html";
    this.onSubmitCancel = options.onSubmitCancel || "addonm.html";

    this.id = id;
    this.name = id;
    this.controls = [];

    if(!active_user.session.forms[id])
        active_user.session.forms[id] = {};

    active_user.session.forms[id].activeInstance = __this;
    active_user.session.forms[id].addonForm = true;


    var __eventEmitter = new events.EventEmitter();
    this.on = function (event, cb) {
        __eventEmitter.on(event, cb);
    };


    this.addControl = function(type, id, options) {

        if (ids.indexOf(id) !== -1)
            throw form_lang.Get(__active_user.lang, "ControlIdDuplicate", true, [id]);

        ids.push(id);

        if (!options) options = { };
        options.extra = options.extra || {};
        options.extra.formName = __this.name;

        if (type === "section") {
            if (section_started) controls.push(tools.endFieldSet());
            controls.push(tools.startFieldSet());
            controls.push(tools.createLegend(options.label || __this.name).html);
            section_started = true;
            return;
        }

        var forms = __factory.db.get("__forms");
        var value = forms && forms[__this.id] ? forms[__this.id][id] : options.value;

        var method = null;
        if (type === "text" || type === "password" || type === "textarea")
            method = tools.createTextBox;
        else
        if (type === "checkbox")
            method = tools.createCheckBox;
        else
        if (type === "combobox")
            method = tools.createComboBox;
        else
        if (type === "simpleText")
            method = tools.createSimpleText;

        controls.push(method(options.label, options.label, id, value, __active_user, options).html);

        /*
         {
         name: "domain_name",
         details: {
             label: "DomainName",
             method: tool.createTextBox,
             options: { required: true, prefix: "www." },
             dbName: "name", // alias to `name` in object database.getDomain();
             cannotEdit: true
         },
         validation : new validations.Domain()
         },
         */

        this.controls.push( {
            name : id,
            details : {
                label : options.label,
                options : options
            }
        });
    };

    var cnt = 0;
    this.addSection = function(label) {
        __this.addControl("section", "section" + (cnt++), { label : label });
    };

    this.render = function() {
        if (section_started) {
            controls.push(tools.endFieldSet());
            section_started = false;
        }

        var script = form_templates.getClientFormScript();
        smart_rule.globals = {"sessionId":__env.sessionId, "active_user": __active_user, "lang":__active_user.lang, form : __this  };
        script = smart_replace(script, smart_rule);

        return script + tools.begin + controls.join("\n") + tools.end + tools.createButtons(__active_user, __this);
    };

    this.callOnSubmit = function(values, cb) {
        __eventEmitter.emit("submit", values, function(save) {
            if (save) {
                var forms = __factory.db.get("__forms") || {};
                forms[__this.id] = values;
                __factory.db.set("__forms", forms);
            }
            cb();
        });
    };
};


global.jxpanel = {
    getAddonFactory: function (env) {
        var active_user = _active_user.getUser(env.SessionID);
        if (!active_user) {
            return {err: form_lang.Get("EN", "Access Denied") };
        }

        if (!active_user.session.addonCurrent )
            return {err: form_lang.Get("EN", "AddOnUnknown") };

        //if (!active_user.session.addon_factory)
        active_user.session.addonCurrent.factory = new extension_class(env, active_user, active_user.session.addonCurrent);

        return active_user.session.addonCurrent.factory;
    },
    server: require("jxm")
};



exports.callEvent = function(event_name, args) {

    var ls = fs.readdirSync(site_defaults.dirAddons);
    for(var o in ls) {
        var addon_name = ls[o];
        var addon = load(addon_name);
        if (addon.err || !addon.events || !addon.events.event) continue;

        try {
            addon.events.event(event_name, args);
        } catch (ex) {
            // do nothing
        }
    }
};


var remove = function(addon) {
    unload(addon.id);
    var res = jxcore.utils.cmdSync("rm -rf " + addon.dir);
    if (res.exitCode)
        return {err : res.out };

    return true;
};


exports.uninstall = function(addon_name, cb) {

    var addon = load(addon_name);
    if (addon.err) {
        cb(addon.err);
        return;
    }

    if (addon.events && addon.events.uninstall) {

        try {
            addon.events.uninstall(function(err) {
                if (err) {
                    cb(err);
                    return;
                }

                var res = remove(addon);
                cb(res.err);
            });
        } catch(ex) {
            cb("AddOnEventsErrorWhileCalling|uninstall|" +  ex.toString());
        }

    } else {
        var res = remove(addon);
        cb(res.err);
    }
};