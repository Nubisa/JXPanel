var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
var datatables = require('./datatable_templates');
var server = require('jxm');
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
    var pam = require('authenticate-pam');

    pam.authenticate(params.username, params.password, function(err) {
        if(err) {
            server.sendCallBack(env, {err: form_lang.Get(params.lang, "CredentialsFailed")});
        }
        else {
            _active_user.loginUser(env.SessionID, params);
            server.sendCallBack(env, {url: "/dashboard.html"});
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

        // checking if field si required and has a value
        if (ctrl.options && ctrl.options.required && !params.controls[o]) {
            messages.push({control:ctrlDisplayName, msg:form_lang.Get(active_user.lang, "ValueRequired1")});
        }

        if(ctrl.validation){
           var res = ctrl.validation.validate(env, active_user, params.controls[o]);
           if(!res.result){
               messages.push({control:ctrlDisplayName, msg:res.msg});
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

methods.sessionApply = function(env, params){

    var active_user = checkUser(env);

    if(!sessionAdd(env, active_user, params))
        return;

    var activeForm = active_user.session.forms[params.form];
    activeForm.activeInstance.apply(active_user, params, function (err) {
        if (err) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Cannot apply the form. ", true) + err });
        } else {
            server.sendCallBack(env, "OK");
        }
    });
};


methods.getTableData = function(env, params) {

    if (params.dt) {
        datatables.render(env.SessionID, params.dt, function(err, str) {
            server.sendCallBack(env, str);
        });
    }
};

module.exports = methods;