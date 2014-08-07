var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
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
var site_defaults = require("./../definitions/site_defaults");


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

            var unlimited = database.getPlan("Unlimited");
            if (!unlimited) {
                // first sudo signing in
                database.AddPlan(null, "Unlimited", {
                    maxDomainCount: 1e5,
                    maxUserCount: 1e5,
                    canCreatePlan: true,
                    canCreateUser: true,
                    planMaximums: {}
                });

                database.AddUser("Unlimited", params.username, { person_name : params.username, firstUser:true });
                try{
                    var ret = system_tools.addSystemUser({plan:"Unlimited", name:params.username }, null, 1);
                    if(ret.err){
                        database.deleteUser(params.username);
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

//    console.log("handling submitted values", params);

    var sform = active_user.session.forms[params.form].activeInstance;

    var messages = [];

    for(var o in params.controls){

        var ctrl = null;
        for(var i in sform.controls){
            if(sform.controls[i].name == o){
                ctrl = sform.controls[i];
            }
        }

        if(!ctrl)
            continue;

        var ctrlDisplayName = form_lang.Get(active_user.lang, ctrl.details.label, true);

        // checking if field is required and has a value
        if (ctrl.options && ctrl.options.required && !params.controls[o]) {
            messages.push({control:ctrlDisplayName, msg:form_lang.Get(active_user.lang, "ValueRequired")});
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

               var res = valids[a].validate(env, active_user, params.controls[o], params.controls, o);
               if(!res.result){
                   messages.push({control:ctrlDisplayName, msg:res.msg});
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

var getFormControls = function(activeInstance) {

    if (!activeInstance)
        throw "Instance of the form is empty.";

    var ret = {};
    for(var i in activeInstance.controls) {
        if (activeInstance.controls[i].name)
            ret[activeInstance.controls[i].name] = activeInstance.controls[i];
    }
    return ret;
};


var update = function(base, ext){
    for(var o in ext){
        base[o] = ext[o];
    }
};


methods.sessionApply = function(env, params){

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    if(!sessionAdd(env, active_user, params))
        return;

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;


    var _controls = getFormControls(activeInstance);

    var json = {};
    var planMaximums = {};
    var cnt = 0;
    for (var field_name in params.controls) {
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
                planMaximums[field_name] = isNaN(val) ? site_defaults.defaultMaximum : val;
                delete json[field_name];
            }
        }
    }

    var sendError = function(errLabel) {
        server.sendCallBack(env, {arr: [ { control: "", msg: form_lang.Get(active_user.lang, errLabel, true)} ] });
    };

    if (!cnt)
        return sendError("FormEmpty");

    var isUpdate = _active_user.isRecordUpdating(active_user, params.form);
    var update_name = isUpdate ? active_user.session.edits[params.form].ID : json.name;

    if (!update_name) {
        return sendError("FormEmpty");
    }

    var ret = null;
    if (params.form === "addUser") {
        try {
            if (isUpdate) {
                var user = database.getUser(update_name);
                if (!user)
                    return sendError("DBCannotGetUser");

                update(user, json);
                ret = database.updateUser(update_name, user);

                if (params.controls["person_password"]) {
                    var res = system_tools.updatePassword(update_name, params.controls["person_password"]);
                    if (res.err)
                        ret = res.err;
                }
            } else {
                ret = database.AddUser(json.plan, json.name, json);
                if (!ret) {
                    var res = system_tools.addSystemUser(json, params.controls["person_password"]);
                    if (res.err) {
                        ret = res.err;
                        database.deleteUser(json.name);
                    }
                }
            }
        } catch(ex) {
            ret = ex.toString();
            if(json && !isUpdate && database.getUser(json.name))
                database.deleteUser(json.name);
        }
    } else
    if (params.form === "addDomain") {
        try {
            if (isUpdate) {
                var domain = database.getDomain(update_name);
                if (!domain)
                    return sendError("DBCannotGetDomain");

                update(domain, json);
                ret = database.updateDomain(update_name, domain);
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
        try {

            // those are required by the form
            json.maxUserCount = parseInt(json.maxUserCount);
            json.maxDomainCount = parseInt(json.maxDomainCount);

            if (isUpdate) {
                var plan = database.getPlan(update_name);
                if (!plan)
                    return sendError("DBCannotGetPlan");

                update(plan, json);
                update(plan.planMaximums, planMaximums);
                ret = database.updatePlan(update_name, plan);
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
        var min = json["jx_app_min_port"];
        var max = json["jx_app_max_port"];
        hosting_tools.setPortRange(min,max);
    } else {
        ret = "UnknownForm";
    }

    if (ret) {

        ret = form_lang.Get(active_user.lang, ret, true);
        for(var field_name in _controls){
            if (ret.indexOf(field_name) !== -1) {
                var label = _controls[field_name].details.label;
                if (label) {
                    label = form_lang.Get(active_user.lang, label, true);
                    ret = ret.replace(field_name, "`" + label + "`");
                }
            }
        }

        server.sendCallBack(env, {arr: [ { control: "", msg : ret } ]});
    } else {
        server.sendCallBack(env, {arr: false});
    }
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
        server.sendCallBack(env, ret);
    });
};


methods.removeFromTableData = function(env, params) {

    if (params.dt === "modules") {
        var ret = uninstallNPM(env, params);
        server.sendCallBack(env, {err : ret.err });
    } else {
        datatables.remove(env.SessionID, params.dt, params.ids, params.with, function(err) {
            server.sendCallBack(env, {err : err });
        });
    }
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


// async way for getting forms' controls' values (e.g. for combo)
methods.getControlsValues = function(env, params) {

    var active_user = _active_user.checkUser(env);
    if (!active_user)
        return;

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;

    var found = false;
    for(var a in activeInstance.controls) {
        if (activeInstance.controls[a].name && activeInstance.controls[a].name === params.control && activeInstance.controls[a].dynamicValues) {
            found = true;
            var ret = activeInstance.controls[a].dynamicValues(active_user);
            server.sendCallBack(env, {err : false, values : ret, control : params.control } );
            return;
        }
    }

    if (!found) {
        server.sendCallBack(env, {err : "Dynamic values loading method not found for field " + params.control  } );
    }
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
        jxcore.utils.cmdSync(cmd);
    };

    //console.log("Installing npm module. name:", name, "version:", version, "with cmd: ", cmd);
    var cmd = "cd '" + site_defaults.dirNativeModules + "'; '" + process.execPath + "' install " + nameAndVersion;
    jxcore.tasks.addTask(task, cmd, function() {
        var id = process.threadId;
        var expectedModulePath = path.join(site_defaults.dirNativeModules, "/node_modules/", name);
        server.sendCallBack(env, {err : !fs.existsSync(expectedModulePath)});
    });
};


methods.monitorStartStop = function (env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    hosting_tools.monitorStartStop(params.op, function(err) {
        if (err) err = form_lang.Get(active_user.lang, err, true);
        server.sendCallBack(env, {err: err });
    });
};

methods.appStartStop = function (env, params) {

    var active_user = _active_user.checkUser(env, true);
    if (!active_user)
        return;

    if (!params.id) {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "'DomainNotFound", true) });
    } else {

        if (active_user.plan !== "unlimited") {
            var domains = database.getDomainsByUserName(active_user.username, 1e7);
            if (domains.indexOf(params.id) === -1) {
                server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Access Denied", true) });
                return;
            }
        }

        hosting_tools.appStartStop(params.op, params.id, function(err) {
            if (err) err = form_lang.Get(active_user.lang, err, true);
            server.sendCallBack(env, {err: err });

            // JXPanel should know, whether user wanted to start or stop an app
            var domain = database.getDomain(params.id);
            domain.jx_enabled = params.op;
            database.updateDomain(params.id, domain);
        });
    }
};


methods.jxInstall = function (env, params) {

    var active_user = _active_user.checkAdmin(env);
    if (!active_user)
        return;

    system_tools.installJX(function(err) {
        if (err) err = form_lang.Get(active_user.lang, err, true);
        server.sendCallBack(env, { err : err });
    });
};



module.exports = methods;