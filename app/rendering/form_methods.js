var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var datatables = require('./datatable_templates');
var util = require("util");
var server = require('jxm');
var pam = require('authenticate-pam');
var methods = {};
var sqlite = require("./../db/sqlite.js");

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
            _active_user.loginUser(env.SessionID, params);
            var _url = "/dashboard.html";
            if(params.url && params.url.indexOf){
                var ind = params.url.indexOf("t=");
                if(params.url.length>ind+7){ // something.html
                    _url = params.url.substr(ind+2, params.url.length-(ind+2)).trim();
                }
            }
            server.sendCallBack(env, {url: _url});
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

    console.log("handling submitted values", params);

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

var getFormControlsDetails = function(activeInstance) {

    if (!activeInstance)
        throw "Instance of the form is empty.";

    var ret = {};
    for(var i in activeInstance.controls) {
        if (activeInstance.controls[i].name)
            ret[activeInstance.controls[i].name] = activeInstance.controls[i].details;
    }
    return ret;
};


methods.sessionApply = function(env, params){

    var active_user = checkUser(env);

    if(!sessionAdd(env, active_user, params))
        return;

    var activeForm = active_user.session.forms[params.form];
    var activeInstance = activeForm.activeInstance;

    var details = getFormControlsDetails(activeInstance);

    var json = {};
    for(var field_name in params.controls) {

        if (details[field_name] && details[field_name].dbName) {
            // replacing form controls names into db field names
            json[details[field_name].dbName] = params.controls[field_name];
        } else {
            json[field_name] = params.controls[field_name];
        }
    }
    if (_active_user.isRecordUpdating(active_user, params.form)) {
        json.ID = active_user.session.edits[params.form].ID;
    }

    activeInstance.settings.dbTable.AddNewOrUpdateAll(sqlite.db, json, activeInstance.settings.json_where, function(err) {
        if (err) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Cannot apply the form. ", true) + err });
        } else {
            server.sendCallBack(env, {err: false});
        }
    });
};


methods.getTableData = function(env, params) {

    datatables.render(env.SessionID, params.dt, function(err, str) {
        server.sendCallBack(env, str);
    });
};


methods.removeFromTableData = function(env, params) {

    datatables.remove(env.SessionID, params.dt, params.ids, function(err) {
        server.sendCallBack(env, {err : err });
    });
};

// called when user clicked Apply on the form
methods.editTableData = function(env, params) {

    datatables.edit(env.SessionID, params.dt, params.id, function(err, url) {
        server.sendCallBack(env, {err : err, url : url});
    });
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
            activeInstance.controls[a].dynamicValues(function(err, ret) {
                server.sendCallBack(env, {err : false, values : ret, control : params.control } );
            });
        }
    }

    if (!found) {
        server.sendCallBack(env, {err : "Dynamic values loading method not found for field " + params.control  } );
    }
};


module.exports = methods;