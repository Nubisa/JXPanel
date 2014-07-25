var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var datatables = require('./datatable_templates');
var forms = require('./form_templates');
var util = require("util");
var server = require('jxm');
var pam = require('authenticate-pam');
var database = require("./../db/database");
var methods = {};


var checkUser = function(env){
    var active_user = _active_user.getUser(env.SessionID, false);

    if(!active_user){
        server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied")});
        return null;
    }

    return active_user;
};

methods.tryLogin = function(env, params){
    pam.authenticate(params.username, params.password, function(err) {
        if(err) {
            server.sendCallBack(env, {err: form_lang.Get(params.lang, "CredentialsFailed")});
        }
        else {

            var finish = function() {

                _active_user.loginUser(env.SessionID, params);
                var _url = "/dashboard.html";
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
                finish();
                return;
            }

            // regular user signing in
            var user = database.getUser(params.username);

            if (!user) {
                server.sendCallBack(env, {err: form_lang.Get(params.lang, "CannotLoginNoUser")});
            } else {
                finish();
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

    var isUpdate = _active_user.isRecordUpdating(active_user, params.form);

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

    var ret = null;
    if (params.form === "addUser") {
        try {
            if (isUpdate) {
                var user = database.getUser(json.name);
                if (!user)
                    return sendError("DBCannotGetUser");

                update(user, json);
                ret = database.updateUser(json.name, user);
            } else {
                ret = database.AddUser(json.plan, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    }

    if (params.form === "addDomain") {
        try {
            if (isUpdate) {
                var domain = database.getDomain(json.name);
                if (!domain)
                    return sendError("DBCannotGetDomain");

                update(domain, json);
                ret = database.updateDomain(json.name, domain);
            } else {
                ret = database.AddDomain(active_user.username, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    }

    if (params.form === "addPlan") {
        try {
            if (isUpdate) {
                var plan = database.getPlan(json.name);
                if (!plan)
                    return sendError("DBCannotGetPlan");

                update(plan, json);
                update(plan.planMaximums, planMaximums);
                ret = database.updatePlan(json.name, plan);
            } else {

                json.canCreateUser = json.maxUserCount + "" !== "0";
                //var mu = parseInt(json.maxUserCount)
                //json.maxUserCount = isNaN(mu) ? 1e5 : mu;

                //var md = parseInt(json.maxDomainCount);
                //json.maxDomainCount = isNaN(md) ? 1e5 : md;

                json.canCreatePlan = planMaximums.plan_max_plans + "" !== "0";
                json.planMaximums = planMaximums;

                ret = database.AddPlan(active_user.username, json.name, json);
            }
        } catch(ex) {
            ret = ex.toString();
        }
    }

    if (ret) {
        server.sendCallBack(env, {arr: [ { control: form_lang.Get(active_user.lang, "Form"), msg : ret } ]});
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

    var ret = forms.renderForm(env.SessionID, params.form, true);
    server.sendCallBack(env, {err : false, html : ret.html, js : ret.js } );
};



methods.removeFromTableData = function(env, params) {

    var ret = datatables.remove(env.SessionID, params.dt, params.ids);
    server.sendCallBack(env, {err : ret.err });
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


module.exports = methods;