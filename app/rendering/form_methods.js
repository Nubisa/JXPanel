var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var datatables = require('./datatable_templates');
var forms = require('./form_templates');
var util = require("util");
var server = require('jxm');
var pam = require('authenticate-pam');
var database = require("./../db/database");
var methods = {};
var fs = require('fs');
var path = require('path');
var system_tools = require('../system_tools');


var checkUser = function(env){
    var active_user = _active_user.getUser(env.SessionID, false);

    if(!active_user){
        server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied")});
        return null;
    }

    return active_user;
};

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

                database.AddUser("Unlimited", params.username, { person_name : params.username });
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
    var active_user = checkUser(env);

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

               var res = valids[a].validate(env, active_user, params.controls[o], params.controls);
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

    var active_user = checkUser(env);

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
                planMaximums[field_name] = json[field_name];
                delete json[field_name];
            }
        }
    }

    var sendError = function(errLabel) {
        server.sendCallBack(env, {arr: [ { control: form_lang.Get(active_user.lang, "Form"), msg: form_lang.Get(active_user.lang, errLabel, true)} ] });
    };

    if (!cnt)
        return sendError("FormEmpty");

    var isUpdate = _active_user.isRecordUpdating(active_user, params.form);
    var update_name = isUpdate ? active_user.session.edits[params.form].ID : json.name;

    var ret = null;
    if (params.form === "addUser") {
        try {
            if (isUpdate) {
                var user = database.getUser(update_name);
                if (!user)
                    return sendError("DBCannotGetUser");

                update(user, json);
                ret = database.updateUser(update_name, user);
            } else {
                ret = database.AddUser(json.plan, json.name, json);
                if (!ret) {
                    var res = system_tools.addSystemUser(json.name,  params.controls["person_password"]);
                    if (res.err) {
                        ret = res.err;
                        database.deleteUser(json.name);
                    }
                }
            }
        } catch(ex) {
            ret = ex.toString();
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
                ret = database.AddDomain(active_user.username, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    } else
    if (params.form === "addPlan") {
        try {
            if (isUpdate) {
                var plan = database.getPlan(update_name);
                if (!plan)
                    return sendError("DBCannotGetPlan");

                update(plan, json);
                update(plan.planMaximums, planMaximums);
                ret = database.updatePlan(update_name, plan);
            } else {

                json.canCreateUser = json.maxUserCount + "" !== "0";
                json.canCreatePlan = planMaximums.plan_max_plans + "" !== "0";
                json.planMaximums = planMaximums;

                ret = database.AddPlan(active_user.username, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    } else
    if (params.form === "jxconfig") {
        var cfg = {
            "jx_app_min_port" : json["jx_app_min_port"],
            "jx_app_max_port" : json["jx_app_max_port"]
        };
        database.setConfig(cfg);
    } else {
        ret = "UnknownForm";
    }

    if (ret) {
        server.sendCallBack(env, {arr: [ { control: form_lang.Get(active_user.lang, "Form"), msg : form_lang.Get(active_user.lang, ret, true) } ]});
    } else {
        server.sendCallBack(env, {arr: false});
    }
};

methods.getTableData = function(env, params) {

    var obj = datatables.render(env.SessionID, params.dt, true);
    server.sendCallBack(env, obj)
};

// getting the form in async way
methods.getForm = function(env, params) {

    var active_user = checkUser(env);
    if (!active_user)
        return;

    if (params.form === "jxconfig") {
        jxcore.monitor.checkMonitorExists(function(err, txt) {
            // todo: just for now saving the value somewhere
            jxcore.monitor.isOnline = !err;
            var ret = forms.renderForm(env.SessionID, params.form, true);
            server.sendCallBack(env, ret);
        });
    } else {
        var ret = forms.renderForm(env.SessionID, params.form, true);
        server.sendCallBack(env, ret);
    }

};


methods.removeFromTableData = function(env, params) {

    if (params.dt === "modules") {
        var ret = uninstallNPM(env, params);
        server.sendCallBack(env, {err : ret.err });
    } else {
        var ret = datatables.remove(env.SessionID, params.dt, params.ids);
        server.sendCallBack(env, {err : ret.err });
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

    var active_user = checkUser(env);

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
    var active_user = checkUser(env);

    for(var i in params.ids) {
        var modulesDir = path.normalize(datatables.jxconfig.globalModulePath + "/node_modules/" + params.ids[i]);

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

    var nameAndVersion = params;
    var name = nameAndVersion;
    var version = "";
    var pos = nameAndVersion.indexOf("@");
    if (pos > -1) {
        var name = nameAndVersion.slice(0, pos).trim();
        var version = nameAndVersion.slice(pos + 1).trim();
    }

    if (!fs.existsSync(datatables.jxconfig.globalModulePath)) {
        fs.mkdirSync(datatables.jxconfig.globalModulePath);
    }

    var task = function(cmd) {
        jxcore.utils.cmdSync(cmd);
    };

    //console.log("Installing npm module. name:", name, "version:", version, "with cmd: ", cmd);
    var cmd = "cd " + datatables.jxconfig.globalModulePath + "; '" + process.execPath + "' install " + nameAndVersion;
    jxcore.tasks.addTask(task, cmd, function() {
        var expectedModulePath = path.join(datatables.jxconfig.globalModulePath, "/node_modules/", name);

        server.sendCallBack(env, {err : !fs.existsSync(expectedModulePath)});
    });
};


methods.monitorStartStop = function (env, params) {

    jxcore.monitor.checkMonitorExists(function (err, txt) {
        var online_before = !err;

        // no point to start monitor, if it's running
        if (params.op && online_before) {
            server.sendCallBack(env, {err: false });
            return;
        }

        // no point to stop monitor if it's not running
        if (!params.op && !online_before) {
            server.sendCallBack(env, {err: false });
            return;
        }


        var checkAfter = function () {
            jxcore.monitor.checkMonitorExists(function (err2, txt2) {
                var online_after = !err2;

                var err = online_after === online_before;
                server.sendCallBack(env, {err: err ? txt2.toString() : false });
            });
        };

        // solution below crashes app, when EADDRINUSE
        // since it cannot be caught, i don't use it
//        var method = online_before ? jxcore.monitor.stopMonitor : jxcore.monitor.startMonitor;
//        try {
//            method(checkAfter);
//        } catch (ex) {
//            server.sendCallBack(env, {err : ex.toString() } );
//        }

        var cmd = "'" + process.execPath + "' monitor " + (params.op ? "start" : "stop");
        jxcore.utils.cmdSync(cmd);
        checkAfter();

        // the "tasks" way, but it doesn't work!
        // never returns from the task ???
//        var task = function (cmd) {
//            return jxcore.utils.cmdSync(cmd);
//        };
//        jxcore.tasks.addTask(task, cmd, checkAfter);

    });

};


module.exports = methods;