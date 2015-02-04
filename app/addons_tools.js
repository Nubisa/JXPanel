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
var datatables = require("./rendering/datatable_templates");
var page_utils = require("./rendering/page_utils");
var server = require("jxm");
var smart_replace = require('./rendering/smart_search').replace;
var tools = require('./rendering/form_tools');
var form_templates = require('./rendering/form_templates');
var events = require("events");
var validations = require("./definitions/validations");

var addons = {};
var addons_methods = {};
var install_check = false;

var checkUpacked = function (addon_dir) {

    if (!fs.existsSync(addon_dir))
        return { err: "AddOnUnknown" };

    var json_path = path.join(addon_dir, "package.json");
    if (!fs.existsSync(json_path))
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
    if (!fs.existsSync(index_path))
        return { err: "AddOnIndexAbsent" };

    try {
        install_check = true;
        var index = require(index_path);
        install_check = false;
    } catch (ex) {
        install_check = false;
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
            events = require(events_path);
        } catch (ex) {
            // invalid file
            return { err : "AddOnEventsCannotRequire" };
        }
    }

    var hostingPlanCriteria = null;
    if (events) {
        //todo validate hostingPlanCriteria return value
        hostingPlanCriteria = callSingeEvent(this, "hostingPlanCriteria");
    }

    return { json: json, index: index, events : events, id :json.id, dir : addon_dir };
};

var unload = function (addon_name) {

    delete addons[addon_name];
    delete addons_methods[addon_name];
    var index_path = path.join(site_defaults.dirAddons, addon_name, "index.js");
    delete require.cache[index_path];
};


var load = function(addon_name) {

//    copy();

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

exports.loadAll = function() {

    var ls = fs.readdirSync(site_defaults.dirAddons);
    for(var o in ls) {
        var stats = fs.statSync(path.join(site_defaults.dirAddons, ls[o]));
        if (stats.isDirectory())
            load(ls[o]);
    }

    return addons;
};


var copy = function () {
    return;
    // temporarily copies addons to server_apps folder
    var cmd = "cp -rf " + path.join(site_defaults.apps_folder, "../addons") + " " + site_defaults.apps_folder + path.sep;
    jxcore.utils.cmdSync(cmd);
};

var getArgs = function(active_user) {

    var parsedUrl = url.parse(active_user.session.lastUrl.replace("addon.html?", "addon.html?_id="), true);
    return parsedUrl.query;
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

    if (!addon_name) {
        cb({ err: "AddOnUnknown" });
        return;
    }

    // just for development process
    unload(addon_name);

    var addon = load(addon_name);
    if (addon.err) {
        cb(addon.err);
        return;
    }

    var wasError = false;
    try {
        var addon_args = getArgs(active_user);
        addon.index.request(env, addon_args, function (err, html) {
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


var extension_class = function (env, active_user, addon_id) {

    var __env = env;
    var __active_user = active_user;
    var __this = this;
    var __addon_id = addon_id;

    var __buttons = [];
    var __tabs = {};

    this.url = {
        addonsList : "addonm.html",
        addon : "/addon.html?" + __addon_id
    };

    this.table = {
        render: function (arr) {
            return datatables.getDataTable(arr) + datatables.getClientTableScript(__active_user) + '<script type="text/javascript">refreshtable();</script>';
        }
    };

    this.form = {
        new : function(id, options) {
            return new form(id, __env, __active_user, options, __this)
        }
    };

    this.html = {
        tickMark : function(value, labelTrue, labelFalse) {
            return form_lang.GetBool(__active_user.lang, value, labelTrue, labelFalse);
        },
        getServerButton: function (caption, method_name, args, addSelection, additionalStyle) {
            if (!args)
                args = {};
            else {
                if (JSON.stringify(args).slice(0,1) !== "{")
                    args = { arg : args };
            }

            var onclick = "window.jxAddonCall('" + method_name +"', " + (JSON.stringify(args)).replace(/"/g, "'") + ", " + addSelection + "); return false";
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, additionalStyle);
            return btn;
        }
    };

    this.tabs = {
        create: function (id, tabs) {

            var str = '<ul id="' + id + '" class="nav nav-tabs bordered">';

            var args = getArgs(__active_user);
            var currentTab = args.tab || null;

            for (var a in tabs) {
                var tab = tabs[a];
                if (!currentTab) currentTab = tab.id; // first tab will be active, if no other tab is specified
                if (currentTab === tab.id)
                    str += '<li class="active" id="' + tab.id + '">';
                else
                    str += '<li id="' + tab.id + '">';

                var icon = tab.icon || '<i class="fa fa-lg fa-gear">';
                str += '<a href="' + __this.url.addon + "&tab=" + tab.id + '">' + icon + '</i> ' + tab.label + '</a></li>';
            }

            str += '</ul>';

            __tabs.html = str;
            __tabs.current = currentTab;
            return str;
        }
    };

    this.header = {
        addClientButton: function (caption, onclick) {
            var btn = page_utils.getSingleButton(form_lang.Get(__active_user.lang, caption, true), "fa-plus", onclick, false);
            __buttons.push(btn);
        },
        addServerButton: function (caption, method_name, args, addSelection) {
            var btn = __this.html.getServerButton(caption, method_name, args, addSelection, false);
            __buttons.push(btn);
        },
        renderButtons: function () {
            if (!__buttons.length)
                return "";

            var html =
                '<span id="buttons" class="jxbuttons-top">' +
                '<i class="fa fa-fw fa-align-justify" style="color: #757a7b;"></i>&nbsp;&nbsp;' +
                '{{datatable.buttons}}' +
                '</span>';

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
        suspendUser : function(user_name, field_name) {
            var user = database.getUser(user_name);
            user.SuspendUser(__addon_id + "@" + field_name);
            database.updateDBFile();
        },
        unSuspendUser : function(user_name, field_name) {
            var user = database.getUser(user_name);
            user.UnSuspendUser(__addon_id + "@" + field_name);
            database.updateDBFile();
        },
//        getUserData : function(user_name) {
//            if (!user_name)
//                user_name = __active_user.username;
//            var user = database.getUser(user_name);
//            // returning copy of the user object
//            var copy = JSON.parse(JSON.stringify(user));
//
//            return copy.data || {};
//        },
//        updateUserData : function(user_name, data) {
//            if (!user_name)
//                user_name = __active_user.username;
//
//            var user = database.getUser(user_name);
//            user.data = JSON.parse(JSON.stringify(data));
//            database.updateUser(user_name, user);
//        },
        get : function(sid) {
            var user = database.getUser(__active_user.username);
            if (user && user.addons && user.addons[__addon_id]) {
                return user.addons[__addon_id][sid];
            }

            return null;
        },
        set : function(sid, value) {
            var user = database.getUser(__active_user.username);
            if (!user.addons) user.addons = {};
            if (!user.addons[__addon_id]) user.addons[__addon_id] = {};
            user.addons[__addon_id][sid] = value;
            database.updateUser(user.name, user);
        },
        remove : function(sid) {
            var user = database.getUser(__active_user.username);
            if (user && user.addons && user.addons[__addon_id]) {
                delete user.addons[__addon_id][sid];
            }
            database.updateUser(user.name, user);
        },
        // returns planMaximums defined by this addon only
        // they are also present in __this.db.getUser() object,
        // but they contain prefix: addon_name@field_name
        getHostingPlanCriteria : function(field_name) {
            var user = __this.db.getUser();
            var plan = database.getPlan(user.plan);
            if (!plan || !plan.planMaximums) return null;

            return plan.GetMaximum(__addon_id + "@" + field_name);
        }
    };

    this.render = function (html) {
        smart_rule.globals = {"sessionId":__env.sessionId, "active_user": __active_user, "lang":__active_user.lang  };
        html = smart_replace(html, smart_rule);

        var file = "";
        var file_name = path.join(site_defaults.dirAddons, __addon_id, "html", __tabs.current + ".html");
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

        var title = addons[__addon_id].json.title || addons[__addon_id].json.name;
        return __this.header.renderButtons() + "<br><h1>" + title + "</h1>" + html;
    };

    this.translate = function(text) {
        return form_lang.Get(__active_user.lang, text, true);
    };

    this.activeUser = {
        getData : function () {
            return this.db.getUser();
        },
        name : __active_user.username,
        isAdmin : _active_user.isAdmin(__active_user)
    };

    this.status = {
        set : function(label) {
            __active_user.session.status = label;
        },
        clear : function() {
            __active_user.session.status = null;
        }
    };
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

    this.onSubmitSuccess = options.onSubmitSuccess || __active_user.session.lastUrl;
    this.onSubmitCancel = options.onSubmitCancel || __active_user.session.lastUrl;

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
        else if (type == "password") {
            options.password = true;
        }
        else if (type == "multiline") {
            options.multiline = true;
        }

        var forms = __factory.db.get("__forms");
        var value = forms && forms[__this.id] && forms[__this.id][id] ? forms[__this.id][id] : options.value;

        var method = tools.getMethod(type);
        if (method)
            controls.push(method(options.label, options.title || options.label, id, value, __active_user, options).html);
        else
            throw form_lang.Get(__active_user.lang, "UnknownMethod", true, [type]);

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
            },
            validation : validations.getValidationByObject(options.validation)
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

        script = script + tools.begin + controls.join("\n") + tools.end;

        if (!options.noButtons)
            script += tools.createButtons(__active_user, __this);

        return script;
    };

    this.callOnSubmit = function(values, cb) {

        if (!events.EventEmitter.listenerCount(__eventEmitter, "submit")) {
            cb();
            return;
        }

        __eventEmitter.emit("submit", values, function(save) {
            if (save) {
                var forms = __factory.db.get("__forms") || {};
                forms[__this.id] = values;
                __factory.db.set("__forms", forms);
            }
            cb();
        });
    };

    this.clear = function() {
        var forms = __factory.db.get("__forms") || {};
        delete forms[__this.id];
        __factory.db.set("__forms", forms);
    };
};

// main method serving addons custom calls from client-side
var addonCall = function(env, params) {

    var active_user = _active_user.getUser(env.SessionID);
    var lang = active_user ? active_user.lang : "EN";
    var sendBack = function(err, params) {
        var obj = {};
        if (err) obj.err = form_lang.Get(lang, err, true);
        if (params) obj.params = params;
        server.sendCallBack(env, obj);
        if (obj.err)
            console.error("addonCall:", obj.err);
    };

    if (!active_user)
        return sendBack("Access Denied");

    // for lastUrl = /addon.html?mongodb&tab=config
    // parsed.search will contain "?mongodb"
    // I use this to obtain addons name
    var parsedUrl = url.parse(active_user.session.lastUrl, true);
    var parsedArr = parsedUrl.search.replace(/&/g, "?").split("?");
    var addon_name = parsedArr.length ? parsedArr[1] : null;

    if (!addon_name || !addons[addon_name])
        return sendBack("AddOnUnknown|" + addon_name);

    var method_name = params.op;

    if (!method_name || !addons_methods[addon_name] || !addons_methods[addon_name][method_name])
        return sendBack("UnknownMethod: " + method_name);

    var wasError = false;
    try {
        addons_methods[addon_name][method_name](env, params, function(err, param) {
            if (!wasError)
                sendBack(err, params);
        });
        return;
    } catch(ex) {
        wasError = true;
        return sendBack("AddOnMethodErrorWhileCalling|" + method_name + ". " + ex);
    }
};


var getGlobal = function(addon_name) {
    var __addon_name = addon_name;

    this.getAddonFactory = function (env) {
        var active_user = _active_user.getUser(env.SessionID);
        if (!active_user)
            return {err: form_lang.Get(active_user.lang, "Access Denied") };

        return new extension_class(env, active_user, __addon_name);
    };

    this.server = {
        addJSMethod : function(name, method) {

            if (!addons_methods["__addonCall"]) {
                server.addJSMethod("addonCall", addonCall);
                addons_methods["__addonCall"] = true;
            }

            if (!addons_methods[__addon_name])
                addons_methods[__addon_name] = {};

            addons_methods[__addon_name][name] = method;
        }
    }

    this.package = { json : null };
    var json_path = path.join(site_defaults.dirAddons, addon_name, "package.json");
    try {
        var json_str = fs.readFileSync(json_path).toString();
        this.package.json = JSON.parse(json_str);
    } catch (ex) {
        this.package.json = ex.toString();
    }
};

// returns instance of global panel api class for specific module
// e.g. call : var jxpanel = global.getJXPanelAPI(this)
global.getJXPanelAPI = function(module) {

    if (!module)
        throw "Cannot get JXPanel API. You must provide module reference as an argument.";

    var fname = module.filename;
    if (!fname && !fs.existsSync(fname))
        throw "Cannot get JXPanel API. Invalid module reference.";

    if (!module.parent && module.parent.filename !== __filename)
        throw "Cannot get JXPanel API. Invalid module's parent.";

    if (!install_check && module.filename.slice(0, site_defaults.dirAddons.length) !== site_defaults.dirAddons)
        throw "Cannot get JXPanel API. Invalid module path.";

    var str = module.filename.slice(site_defaults.dirAddons.length);
    var parsed = str.split(path.sep);

    var addon_name = parsed[0];

    return new getGlobal(addon_name);
};

var callSingeEvent = function(addon, event_name, args, cb) {

    var ret = null;

    if (!addon.events || !addon.events.event) {
        // no error
        if (cb) cb();
        return ret;
    }

    if (!cb) {
        try {
            // if no callback, emit event and don't care for the callback result
            // however, gathers immediate return values
            ret = addon.events.event(event_name, args);
        } catch (ex) {
            return { err : "AddOnEventsErrorWhileCalling|" + event_name + "|" +  ex.toString() };
        }
        return ret;
    }

    if (cb) {
        var wasError = null;
        try {
            addon.events.event(event_name, args, function(err) {
                if (!wasError) cb(err);
            });
        } catch (ex) {
            wasError = true;
            cb("AddOnEventsErrorWhileCalling|" + event_name + "|" +  ex.toString());
        }
    }

    return ret;
};

// calls specific events for all addons
// it calls without a callback - doesn't care for the cb result
// however, gathers immediate return values
exports.callEvent = function(event_name, args) {

    exports.loadAll();
    var ret = {};
    for(var addon_name in addons)
        ret[addon_name] = callSingeEvent(addons[addon_name], event_name, args);

    return ret;
};

// checks if any of addon's custom maximums has been changed for any of users
// and calls those addon's events
exports.checkHostingPlanCriteriaChanged = function(plan, planData, planMaximumsData) {

    // for now we're checking only maximums change values
    if (!planMaximumsData)
        return;

    exports.loadAll();

    var users = database.getUsersByPlanName(plan.name, 1e7);
    for(var o in users) {
        var user = database.getUser(users[o]);
        if (!user) continue;
        var user_plan = database.getPlan(user.plan);
        if (!user_plan) continue;

        var user_changes = {};
        var changed = false;
        for(var field_name in planMaximumsData) {
            // only fields containg addon_name@
            if (field_name.indexOf("@") === -1) continue;

            var parsed = field_name.split("@");
            var addon_name = parsed[0];
            var addon_field_name = parsed[1];
            // there is no such addon
            if (!addons[addon_name]) continue;

            var ret = { };
            ret.user = user.name;
            ret.old = undefined;
            if (user.plan === plan.name) {
                ret.old = planMaximumsData[field_name].old;
            } else {
                if (user_plan.planMaximums && user_plan.planMaximums[field_name])
                    ret.old = user_plan.planMaximums[field_name];
            }

            ret.new = planMaximumsData[field_name].new;
            ret.checkSuspension = ret.new < ret.old;

            user_changes[addon_field_name] = ret;
            changed = true;
        }

        if (changed)
            callSingeEvent(addons[addon_name], "hostingPlanCriteriaChanged", user_changes);
    }
};


var remove = function(addon) {

    // removing addon's controls from user form's instances
    _active_user.removeAddonControls(addon.id);

    // cleaning db from addon's entries
    var removed = false;
    var users = database.getUsersByPlanName(database.unlimitedPlanName, 1e7);
    for (var o in users) {
        var user = database.getUser(users[o]);
        if (!user)
            continue;

        // removing e.g. user.addons[mongodb] value
        if (user.addons && user.addons[addon.id]) {
            delete user.addons[addon.id];
            removed = true;
        }

        var plan = database.getPlan(user.plan);
        if (!plan)
            continue;

        var prefix = addon.id + "@";
        // removing e.g. user["mongodb@txt1"] value
        for(var o in plan) {
            if (o.slice(0, prefix.length) === prefix) {
                delete plan[o];
                removed = true;
            }
        }

        // removing e.g. user.planMaximums["mongodb@txt1"] value
        if (plan.planMaximums) {
            for(var o in plan.planMaximums) {
                if (o.slice(0, prefix.length) === prefix) {
                    delete plan.planMaximums[o];
                    removed = true;
                }
            }
        }
    }

    if (removed)
        database.updateDBFile();


    unload(addon.id);
    var res = jxcore.utils.cmdSync("rm -rf " + addon.dir);
    if (res.exitCode)
        return {err : res.out };

    return true;
};


exports.uninstall = function(active_user, addon_name, cb) {

    if (!_active_user.isAdmin(active_user)) {
        cb("Access Denied");
        return;
    }

    var addon = load(addon_name);
    if (addon.err) {
        cb(addon.err);
        return;
    }

    callSingeEvent(addon, "addonUninstall", null, function(err) {

        if (err) {
            cb(err);
        } else {
            var res = remove(addon);
            cb(res.err);
        }
    });
};



exports.install = function(active_user, zipFile, cb) {

    if (!_active_user.isAdmin(active_user)) {
        cb("Access Denied");
        return;
    }

    var tmpDir = path.join(site_defaults.apps_folder, "__tmp" + jxcore.utils.uniqueId());
    if (fs.existsSync(tmpDir))
        fs.rmdirSync(tmpDir);

    fs.mkdirSync(tmpDir);

    var newZipFile = path.join(tmpDir, "file.zip");

    var cmd = "cp " + zipFile + " " + newZipFile  +" && ";
    cmd += "cd " + tmpDir + " && ";
    cmd += "unzip -u " + newZipFile;

    var res = jxcore.utils.cmdSync(cmd);
//    console.log("zipFile", zipFile);
//    console.log("newZipFile", newZipFile);
//    console.log("cmd", cmd);
//    console.log(res);

    var addon = checkUpacked(tmpDir);
    if (addon.err) {
        jxcore.utils.cmdSync("rm -rf " + tmpDir);
        cb(addon.err);
        return;
    }

    fs.unlinkSync(newZipFile);

    var addon_dir = path.join(site_defaults.dirAddons, addon.json.id);
    var update = false;
    if (fs.existsSync(addon_dir)) {
        update = true;
        console.log("Addon updated");
        unload(addon.json.id);
        jxcore.utils.cmdSync("cp -rf " + tmpDir + path.sep + "* " + addon_dir + path.sep + " && rm -rf " + tmpDir);
    } else {
        console.log("Addon installed");
        jxcore.utils.cmdSync("mv " + tmpDir + " " + addon_dir);
    }

    // now we can load the addon
    var addon = load(addon.json.id);
    if (addon.err) {
        jxcore.utils.cmdSync("rm -rf " + addon_dir);
        cb(addon.err);
        return;
    }

    callSingeEvent(addon, update ? "addonUpdate" : "addonInstall", null, function(err) {

        if (err) {
            var res = remove(addon);
            cb(err);
        } else {
            cb();
        }
    });
};



exports.getAddon = function(addon_name) {

    return load(addon_name);
};