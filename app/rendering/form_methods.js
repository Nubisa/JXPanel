var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var user_folders = require('../definitions/user_folders');
var datatables = require('./datatable_templates');
var forms = require('./form_templates');
var util = require("util");
var server = require('jxm');
var pam = require('authenticate-pam');
var database = require("./../install/database");
var methods = {};
var fs = require('fs');
var path = require('path');
var system_tools = require('../system_tools');
var hosting_tools = require('../hosting_tools');
var addons_tools = require('../addons_tools');
var site_defaults = require("./../definitions/site_defaults");
var tools = require("./form_tools");
var ftp = require("./../install/ftp");
var apps_tools = require("./apps_tools");
var events = require("../events");
var ansi_regex = require("ansi-regex")();


methods.tryLogin = function(env, params){
    if(!params || !params.username || !params.password){
        server.sendCallBack(env, {err: form_lang.Get("EN", "CannotLoginNoUser")});
        return;
    }

    params.lang = params.lang || "EN";

    pam.authenticate(params.username, params.password, function(err) {
        if(err) {
            server.sendCallBack(env, {err: form_lang.Get(params.lang, "CredentialsFailed")});
        }
        else {

            var finish = function(env, params) {
                var _url = "/dashboard.html";
                if(!_active_user.loginUser(env, params)){
                    server.sendCallBack(env, {err: form_lang.Get(params.lang, "CannotLoginNoUser")});
                    return;
                }

                if(params.url && params.url.indexOf){
                    var ind = params.url.indexOf("t=");
                    if(params.url.length>ind+7 && ind>0){ // something.html
                        if(ind>0)
                            ind += 2;
                        _url = params.url.substr(ind, params.url.length-(ind)).trim();
                    }
                }

                server.sendCallBack(env, {url: _url});
            };

            var unlimited = database.getPlan(database.unlimitedPlanName);
            if (!unlimited) {
                // first sudo signing in
                database.AddPlan(null, database.unlimitedPlanName, {
                    maxDomainCount: 1e5,
                    maxUserCount: 1e5,
                    canCreatePlan: true,
                    canCreateUser: true,
                    planMaximums: {},
                    plan_custom_socket : true,
                    plan_sys_exec : true,
                    plan_local_native_modules : true,
                    plan_ssh : true
                });

                database.AddUser(database.unlimitedPlanName, params.username, { person_name : params.username, firstUser:true, ftp_access : true, panel_access : true });

                var res = ftp.allowUser(params.username);
                if (res.err)
                    console.log(res.err);

                try{
                    var ret = system_tools.addSystemUser({plan:database.unlimitedPlanName, name:params.username }, null, 1);
                    if(ret.err){
                        // why to remove first logging user?
                        //database.deleteUser(params.username);
                        server.sendCallBack(env, {err: form_lang.Get("EN", ret.err, true)});
                        return;
                    }
                }catch(e){
                    server.sendCallBack(env, {err: e.toString()});
                    return;
                }
                finish(env, params);
                return;
            }

            // regular user signing in
            var user = database.getUser(params.username);

            if (!user) {
                server.sendCallBack(env, {err: form_lang.Get(params.lang, "CannotLoginNoUser")});
            } else
            if (!user["panel_access"] && user.plan !== database.unlimitedPlanName ) {
                server.sendCallBack(env, {err: form_lang.Get(params.lang, "CannotLoginNoAccess")});
            } else {
                finish(env, params);
            }
        }
    });
};

var sessionAdd = function(env, active_user, params){
    var active_user = _active_user.checkUser(env);

    if(!active_user || !params.form || !params.controls || !active_user.session.forms[params.form]){
        // TODO send a notification or redirect user page to login!
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "SessionExpired"), relogin:true });
        return false;
    }

    var sform = active_user.session.forms[params.form].activeInstance;

    var messages = [];

    // o is field name
    for(var o in params.controls){

        var ctrl = null;
        for(var i in sform.controls){
            if(sform.controls[i].name == o){
                ctrl = sform.controls[i];
            }
        }

        if(!ctrl)
            continue;

        var fakeId = active_user.session.forms[params.form].fakeIdsReversed[o];

        var ctrlDisplayName = form_lang.Get(active_user.lang, ctrl.details.label, true);

        // checking if field is required and has a value
        if (ctrl.options && ctrl.options.required && !params.controls[o]) {
            messages.push({ msg:form_lang.Get(active_user.lang, "ValueRequired"), id : fakeId});
        }

        var valids = [];

        if(ctrl.validation) {
//            console.log("isarray? ", util.isArray(ctrl.validation), ctrl.validation);
            // multiple validations for one field
            if (util.isArray(ctrl.validation)) {
                valids = valids.concat(ctrl.validation);
            } else {
                valids.push(ctrl.validation);
            }
        }

        if (valids.length) {
           for(var a in valids) {

               // this is used for not updating field, whenever they have null values
               if (ctrl.details && ctrl.details.options.dont_update_null && !params.controls[o]) {
                   continue;
               }

               var res = valids[a].validate(env, active_user, params.controls[o], params, o);


               if(!res.result){
                   var ob = { id : fakeId};
                   for (var o in res) {
                       if (o !== "result")
                        ob[o] = res[o];
                   }
                   messages.push(ob);
               }
           }
        }
    }

    if(messages.length){
        server.sendCallBack(env, {arr:messages});
        return false;
    }
    else
        return true;
};

var update = function(base, ext){
    var changed = false;
    var ret = {};
    for(var o in ext){
        if (base[o] !== ext[o]) {
            changed = true;
            ret[o] = { old : base[o], new : ext[o] };
        }
        base[o] = ext[o];
    }
    return changed ? ret : false;
};

// translating fake ids into real ids
var translateFakeIds = function(activeForm, controls) {

    for (var fld in controls) {
        if (activeForm.fakeIds[fld]) {
            controls[activeForm.fakeIds[fld]] = controls[fld];
            delete controls[fld];
        } else {
            return { err : "FieldNotFound|" + fld };
        }
    }
    return false;
};


methods.sessionApply = function(env, params){

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    var sendError = function(errLabel) {

        if (!errLabel) {
            server.sendCallBack(env, {arr: false});
            return;
        }

        errLabel = form_lang.Get(active_user.lang, errLabel, true);
        var label = null;
        var fakeId = null;
        for(var field_name in _controls){
            if (errLabel.indexOf(field_name) !== -1) {
                label = _controls[field_name].details.label;
                fakeId = active_user.session.forms[params.form].fakeIdsReversed[field_name];
                if (label) {
                    label = form_lang.Get(active_user.lang, label, true);
                    errLabel = errLabel.replace(field_name, "`" + label + "`");
                }
                break;
            }
        }

        active_user.session.status = null;
        if (errLabel)
            errLabel = errLabel.replace(ansi_regex, "");

        server.sendCallBack(env, {arr: [ { msg: form_lang.Get(active_user.lang, errLabel, true), id : fakeId} ] });
    };

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;

    var res = translateFakeIds(activeForm, params.controls);
    if (res.err) {
        sendError(res.err);
        return;
    }

    if(!sessionAdd(env, active_user, params))
        return;

    var _controls = tools.getFormControls(activeInstance);

    var json = {};
    var planMaximums = {};
    var cnt = 0;
    for (var fld in params.controls) {
        var field_name = fld;
        var val = params.controls[field_name];
        if (_controls[field_name]) {
            cnt++;
            var ctrl = _controls[field_name];
            var det = ctrl.details;

            if (det.options.dont_update_null && !val) {
                continue;
            }

            if (det.dbName === false) {
                // dont save to db
                continue;
            }

            if (det.dbName) {
                // replacing form controls names into db field names
                field_name = det.dbName;
            }

            if (val.trim)
                val = val.replace(/&#64;/g, "@");

            if (ctrl.convert)
                json[field_name] = ctrl.convert(val);
            else
                json[field_name] = val;

            if (det.definesMax) {
                var val = parseInt(json[field_name]);
                planMaximums[field_name] = isNaN(val) ? database.defaultMaximum : val;
                delete json[field_name];
                delete json[fld];
            }
        }
    }

    if (!cnt && !activeForm.activeInstance.allowEmpty)
        return sendError("FormEmpty");

    if (activeForm.addonForm) {

        activeInstance.callOnSubmit(json, function() {
            sendError(false);
        });
        return;
    }

    var isUpdate = _active_user.isRecordUpdating(active_user, params.form);
    var update_name = isUpdate ? isUpdate : json.name;

    var ret = null;
    if (params.form === "addUser") {
        if (!update_name)
            return sendError("FormEmpty");

        try {
            if (isUpdate) {
                var user = database.getUser(update_name);
                if (!user)
                    return sendError("DBCannotGetUser");

                var old_plan = user.plan;
                var new_plan = json.plan;

                if (typeof new_plan === "undefined" && active_user.username !== update_name)
                    return sendError("PlanInvalid");

                if (old_plan !== new_plan && typeof new_plan !== "undefined") {
                    var res = user_folders.moveUserHome(update_name, new_plan);
                    if (res.err)
                        ret = res.err;
                }

                if (!ret) {
                    update(user, json);
                    ret = database.updateUser(update_name, user);

                    if (params.controls["person_password"]) {
                        var res = system_tools.updatePassword(update_name, params.controls["person_password"]);
                        if (res.err)
                            ret = res.err;
                    }

                    if (!json.panel_access && user.plan !== database.unlimitedPlanName) {
                        // user cannot update by himself panel_access field
                        if (active_user.username !== update_name)
                            _active_user.clearUserByName(update_name);
                    }
                }
            } else {
                ret = database.AddUser(json.plan, json.name, json);
                if (!ret) {
                    if (!params.controls["person_username_ok"]) {
                        var res = system_tools.addSystemUser(json, params.controls["person_password"]);
                        if (res.err) {
                            ret = res.err;
                            database.deleteUser(json.name);
                        }
                    } else {
                        // we should move home dir if exists
                        var new_plan = json.plan;
                        var res = user_folders.moveUserHome(update_name, new_plan);
                        if (res.err)
                            ret = res.err;
                    }
                }
            }

            var res = json.ftp_access ? ftp.allowUser(update_name) : ftp.denyUser(update_name);
            if (res.err)
                ret = res.err;

            if (!ret)
                events.call(active_user, isUpdate ? "userUpdate" : "userAdd", { name : update_name, values : json });

        } catch(ex) {
            ret = ex.toString();
            if(json && !isUpdate && database.getUser(json.name))
                database.deleteUser(json.name);
        }
    } else
    if (params.form === "addDomain") {
        if (!update_name)
            return sendError("FormEmpty");

        try {
            if (isUpdate) {
                var domain = database.getDomain(update_name);
                var jx_web_log_changed = domain.jx_web_log !== json.jx_web_log;
                var jx_app_path_changed = domain.jx_app_path !== json.jx_app_path;
                var jx_app_type_changed = domain.jx_app_type !== json.jx_app_type;
                var jx_app_options = hosting_tools.appGetOptions(update_name);
                var ssl_changed = domain.ssl !== json.ssl || domain.ssl_crt !== json.ssl_crt || domain.ssl_key !== json.ssl_key;
                if (!domain)
                    return sendError("DBCannotGetDomain");

                update(domain, json);
                ret = database.updateDomain(update_name, domain);

                if (!ret) {

                    var saveNginxConfig = function() {
                        if (jx_web_log_changed || ssl_changed) {
                            var res = hosting_tools.appSaveNginxConfigPath(update_name, true);
                            if (res.err)
                                return res.err;
                        }

                        return null;
                    };

                    apps_tools.checkAppConfigChange(active_user, update_name, params.controls, function(err, changed) {
                        if (err)
                            return sendError(err);

                        if (jx_app_path_changed || jx_app_type_changed || changed) {
                            if (jx_app_options && !jx_app_options.err) {
                                var file = jx_app_options.cfg_path;
                                if (fs.existsSync(file)) {
                                    fs.unlinkSync(file);
                                }
                            }

                            hosting_tools.appRestart(active_user, update_name, function(err) {
                                if (err)
                                    return sendError(err);
                                else
                                    return sendError(saveNginxConfig());
                            });
                        } else {
                            return sendError(saveNginxConfig());
                        }
                    });
                    return;
                }
            } else {
                var arr = hosting_tools.getFreePorts(2);
                if (!arr || arr.length < 2) {
                    var range = hosting_tools.getPortRange();
                    ret = form_lang.Get(active_user.lang, "JXcoreAppSmallPortRange", true, [ range.count, range.count + 2 ])
                } else {
                    json.port_http = arr[0];
                    json.port_https = arr[1];
                    ret = database.AddDomain(active_user.username, json.name, json);

                    if (!ret) {
                        // creating dir for a domain
                        var ret1 = hosting_tools.appCreateHomeDir(json.name);
                        if (ret1 && ret1.err) {
                            ret = ret1.err;
                            database.deleteDomain(json.name);
                        }
                    }
                }
            }
        } catch(ex) {
            ret = ex.toString();
        }
    } else
    if (params.form === "addPlan") {
        if (!update_name)
            return sendError("FormEmpty");

        try {

            // those are required by the form
            json.maxUserCount = parseInt(json.maxUserCount);
            json.maxDomainCount = parseInt(json.maxDomainCount);

            if (isUpdate) {
                var plan = database.getPlan(update_name);
                if (!plan)
                    return sendError("DBCannotGetPlan");

                var changed1 = update(plan, json);
                var changed2 = update(plan.planMaximums, planMaximums);
                ret = database.updatePlan(update_name, plan);

                if (!ret && (changed1 || changed2))
                    addons_tools.checkHostingPlanCriteriaChanged(plan, changed1, changed2);

                if (!ret && (changed1 || changed2)) {
                    var all_domains = database.getDomainsByPlanName(update_name, 1e5);
                    hosting_tools.appRestartMultiple(all_domains, function(err) {
                        sendError(err);
                    });
                    return;
                }
            } else {

                json.canCreateUser = json.maxUserCount !== 0;
                json.canCreatePlan = planMaximums.plan_max_plans !== 0;
                json.planMaximums = planMaximums;

                ret = database.AddPlan(active_user.username, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    } else
    if (params.form === "jxconfig") {
        var allow_api = !!json["jx_monitor_api"];
        var jx_monitor_api_changed = !!database.getConfigValue("jx_monitor_api") !== allow_api ;
        database.setConfigValue("jx_monitor_api", allow_api);

        var min = json["jx_app_min_port"];
        var max = json["jx_app_max_port"];
        var changed = hosting_tools.setPortRange(min,max);
        if (changed | jx_monitor_api_changed) {
            hosting_tools.monitorRestart(active_user, function(err) {
                sendError(err);
            });
            return;
        }
    } else {
        ret = "UnknownForm";
    }

    sendError(ret);
};

methods.getTableData = function(env, params) {

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    hosting_tools.getMonitorJSON(false, function(err, ret) {
        // todo: just for now saving the value somewhere
        active_user.session.monitor = { isOnline : !err && ret, json : ret };
        var obj = datatables.render(env.SessionID, params.dt, true);
        active_user.session.monitor = null;
        server.sendCallBack(env, obj)
    });

};

// getting the form in async way
methods.getForm = function(env, params) {

    var active_user = _active_user.checkUser(env, true, params.form);
    if (!active_user)
        return;

    hosting_tools.getMonitorJSON(false, function(err, ret) {
        // todo: just for now saving the value somewhere
        active_user.session.monitor = { isOnline : !err && ret, json : ret };
        var ret = forms.renderForm(env.SessionID, params.form, true);
        active_user.session.monitor = null;
        ret.new = !!!_active_user.isRecordUpdating(active_user, params.form);
        server.sendCallBack(env, ret);
    });
};


methods.removeFromTableData = function(env, params) {

    var active_user = _active_user.checkUser(env, true, params.form);
    if (!active_user)
        return;

    if (params.dt === "modules") {
        var ret = uninstallNPM(env, params);
        server.sendCallBack(env, {err: ret.err });
        return;
    }

    if (params.dt === "addons") {

        addons_tools.uninstall(active_user, params.ids[0], function(err) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, err, true) });
        });
        return;
    }

    datatables.remove(env.SessionID, params.dt, params.ids, params.with, function(err) {
        server.sendCallBack(env, {err : err });
    });
};

// called when user clicked Apply on the form
methods.editTableData = function(env, params) {

    var ret = datatables.edit(env.SessionID, params.dt, params.id);
    server.sendCallBack(env, {err : ret.err, url : ret.url});
};

methods.logout = function(env, params) {

    _active_user.clearUser(env.SessionID);
    server.sendCallBack(env, {err : false} );
};


var uninstallNPM = function(env, params) {

    var failures = [];
    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    for(var i in params.ids) {
        var modulesDir = path.normalize(site_defaults.dirNativeModules + "/node_modules/" + params.ids[i]);

        var ok = true;
        if (fs.existsSync(modulesDir)) {
            ok = system_tools.rmdirSync(modulesDir);
        }
        if (!ok)
            failures.push(params.ids[i]);
    }

    return { err : failures.length ? form_lang.Get(active_user.lang, "JXcoreNPMCouldNotUnInstall", true, [ failures.join(", ") ]) : false }
};


methods.installNPM = function(env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    var nameAndVersion = params;
    var name = nameAndVersion;
    var version = "";
    var pos = nameAndVersion.indexOf("@");
    if (pos > -1) {
        var name = nameAndVersion.slice(0, pos).trim();
        var version = nameAndVersion.slice(pos + 1).trim();
    }

    if (!fs.existsSync(site_defaults.dirNativeModules)) {
        fs.mkdirSync(site_defaults.dirNativeModules);
    }

    var task = function(cmd) {
        return jxcore.utils.cmdSync(cmd);
    };

    //console.log("Installing npm module. name:", name, "version:", version, "with cmd: ", cmd);
    var cmd = "cd '" + site_defaults.dirNativeModules + "'; '" + process.execPath + "' install " + nameAndVersion;
    jxcore.tasks.addTask(task, cmd, function(ret) {
        var id = process.threadId;
        var expectedModulePath = path.join(site_defaults.dirNativeModules, "/node_modules/", name);
        server.sendCallBack(env, {err : !fs.existsSync(expectedModulePath)});
    });
};


methods.monitorStartStop = function (env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    hosting_tools.monitorStartStop(active_user, params.op, function(err) {
        if (err) err = form_lang.Get(active_user.lang, err, true);
        server.sendCallBack(env, {err: err });
    });
};

methods.appStartStop = function (env, params) {

    var active_user = _active_user.checkUser(env, true);
    if (!active_user)
        return;

    if (!params.id) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "DomainNotFound", true) });
    } else {

        if (active_user.plan !== database.unlimitedPlanName) {
            var domains = database.getDomainsByUserName(active_user.username, 1e7);
            if (domains.indexOf(params.id) === -1) {
                server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Access Denied", true) });
                return;
            }
        }

        hosting_tools.appStartStop(params.op, params.id, function(err, domain_name, online_before) {

            // JXPanel should know, whether user wanted to start or stop an app
            var domain = database.getDomain(params.id);
            domain.jx_enabled = params.op;
            database.updateDomain(params.id, domain);

            // reading new status of the app
            var addDomain = require("../definitions/forms/addDomain").form();
            var controls = tools.getFormControls(addDomain);

            hosting_tools.getMonitorJSON(false, function(err2, ret) {
                // todo: just for now saving the value somewhere
                active_user.session.monitor = { isOnline : !err2 && ret, json : ret };
                var status = controls["jx_app_status"].details.getValue(active_user, { name : params.id });
                active_user.session.monitor = null;
                server.sendCallBack(env, {err: err ? err : err2, status : status, div : params.div });
            });
        });
    }
};

methods.appViewLog = function (env, params) {
    var active_user = _active_user.checkUser(env, true);
    if (!active_user)
        return;

    //  if the call was made from addDomain form, session.edits exists
    if (!_active_user.isRecordUpdating(active_user, "addDomain")) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Access Denied", true) });
        return;
    }

    var domain_name = active_user.session.edits["addDomain"].ID;

    var options = hosting_tools.appGetOptions(domain_name);
    if (options.err) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, options.err, true) });
        return;
    }

    var domains = database.getDomainsByUserName(active_user.username, 1e7);
    if (domains.indexOf(domain_name) === -1) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Access Denied", true) });
        return;
    }

    var activeForm = active_user.session.forms["appLog"];
    if (!activeForm) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "UnknownForm", true) });
    }

    var res = translateFakeIds(activeForm, params.controls);
    if (res.err) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, res.err, true) });
        return;
    }

    // truncating the log
    if (params.controls == -1) {

        if (!fs.existsSync(options.log_path)) {
            server.sendCallBack(env, {err: false, log : "" });
            return;
        }

        fs.truncateSync(options.log_path, 0);
    }

    var log = "";
    var size = null;
    if (fs.existsSync(options.log_path)) {

        try {
            log = fs.readFileSync(options.log_path).toString();
        } catch(ex) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "JXcoreAppLogCannotRead", true)});
            return;
        }

        if (params.controls && params.controls.app_log_last_lines) {

            var lines = parseInt(params.controls.app_log_last_lines);
            if (isNaN(lines)) {
                server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "ValueInvalidInteger", true)});
                return;
            }
            // arr
            log = log.trim().split("\n");
            // string again
            log = log.slice(log.length - params.controls.app_log_last_lines).join("<br>");
        } else {
            log = log.replace( new RegExp("\n", "g"), "<br>");
        }

        try {
            var stats = fs.statSync(options.log_path);
            size = stats.size;
        } catch(ex) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "JXcoreAppLogCannotRead", true)});
            return;
        }
    }
    server.sendCallBack(env, {err: false, log : log,  size : size});
};


methods.appInstall = function (env, params) {
    var active_user = _active_user.checkUser(env, true);
    if (!active_user)
        return;

    var domain_name = _active_user.isRecordUpdating(active_user, "addDomain");

    //  if the call was made from addDomain form, session.edits exists
    if (!domain_name) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Access Denied", true) });
        return;
    }

    apps_tools.installUninstall(active_user, domain_name, params.id, params.op, function(par) {
        var err = par && par.err ? form_lang.Get(active_user.lang, par.err, true) : false;
        server.sendCallBack(env, {err: err });
    });


};


methods.jxInstall = function (env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    system_tools.installJX(active_user, function(err) {
        if (err) err = form_lang.Get(active_user.lang, err, true);
        server.sendCallBack(env, { err : err });
    });
};


methods.langUpdate = function (env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    if (typeof params.show_only_undefined !== "undefined") {
        form_lang.show_only_undefined = params.show_only_undefined;
        server.sendCallBack(env, { err : false });
        return;
    }

    console.log(params);
    var changed = form_lang.langUpdate(params);
    server.sendCallBack(env, { err : false, changed : changed });
};


methods.addSubDomain = function (env, params) {

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    var domain = database.getDomain(params.id);
    if (!domain)
        return server.sendCallBack(env, { err : form_lang.Get(active_user.lang, "DomainNotFound", true) });

    if (domain.main_domain_name)
        return server.sendCallBack(env, { err : form_lang.Get(active_user.lang, "SubDomainCanOnlyAddToDomain", true) });

    var is_my_domain = database.isOwnerOfDomain(active_user.username, params.id);
    var is_parents_domain = false;

    if (!is_my_domain) {
        if (!_active_user.isAdmin(active_user)) {
            var parent_user = database.getParentUserByUserName(active_user.username);
            if (!parent_user)
                return server.sendCallBack(env, { err : form_lang.Get(active_user.lang, "DBCannotGetParentUser", true) });

            is_parents_domain = database.isOwnerOfDomain(parent_user.name, params.id)
        } else {
            // i am superuser
            is_parents_domain = true;
        }
    }

    if (!is_my_domain && !is_parents_domain)
        return server.sendCallBack(env, { err : form_lang.Get(active_user.lang, "Access Denied", true) });

    active_user.session.edits = active_user.session.edits || {};
    // remembers main domain name
    active_user.session.edits.addSubdomainForDomain = params.id;
    active_user.session.edits.allowPage = "/adddomain.html";
    server.sendCallBack(env, { err : false });
};


methods.getUserDomains = function (env, params) {

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    var user = database.getUser(active_user.username);
    if (!user)
        return server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "DBCannotGetUser", true) });

    var my_domains = database.getDomainsByUserName(active_user.username);
    var parent_user_domains = [];

    if (!_active_user.isAdmin(active_user)) {
        var plan = database.getPlan(user.plan);
        if (!plan)
            return server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "DBCannotGetPlan", true) });

        var parent_user_domains = database.getDomainsByUserName(plan.owner);
    }

    var arr = [], arr1 = [], arr2 = [];

    if (my_domains.length) {
        for(var o in my_domains) {
            var d = database.getDomain(my_domains[o])
            if (d && !d.main_domain_name)
                arr1.push(my_domains[o]);
        }
    }

    if (my_domains.length) {
        for(var o in parent_user_domains) {
            var d = database.getDomain(parent_user_domains[o])
            if (d && !d.main_domain_name)
                arr2.push(parent_user_domains[o]);
        }
    }

    if (arr1.length) {
        var header = arr2.length ? ["My domains:"] : [];
        arr = arr.concat(header, arr1);
    }
    if (arr2.length)
        arr = arr.concat(["Parent user domains:"], arr2);

    //console.log("getUserDomains", arr);
    var err = arr.length ? false : form_lang.Get(active_user.lang, "DomainsNone", true);

    server.sendCallBack(env, { err : err, res : arr });
};




module.exports = methods;