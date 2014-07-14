var _active_user = require('../definitions/active_user');
var form_lang = require('../definitions/form_lang');
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

var validateControl = function (active_user, form_name, key, value) {

    var activeInstance = active_user.session.forms[form_name].activeInstance;

    var control = activeInstance.controls[key];
    var valids = control.validation;

    if (valids) {
        for (var a in valids) {
            var v = valids[a];
            var valueStr = value + "";

            if (v === "bool") {
                var allowed = ["1", "0", "true", "false"];
                if (allowed.indexOf(valueStr) == -1) {
                    return form_lang.Get(active_user.lang, "ValueInvalidBoolean");
                }
            }

            if (v === "int") {
                console.log("testing INT");
                var i = parseInt(valueStr);
                if (isNaN(i)) {
                    return form_lang.Get(active_user.lang, "ValueInvalidInteger");
                }
            }

            if (v === "gte") {
                console.log("testing gte");
                var i = parseInt(valueStr);
                if (isNaN(i) || i < valids[a+1] ) {
                    return form_lang.Get(active_user.lang, "ValueInvalidIntegerGTE").replace("%s", valids[a+1]);
                }
            }
        }
    }
    return true;
};

methods.sessionAdd = function(env, params){
    var active_user = checkUser(env);

    if(!active_user)
        return;

    if(params.form)
    {
        if(!active_user.session.forms[params.form])
            active_user.session.forms[params.form] = {};

        var ret = validateControl(active_user, params.form, params.key, params.value);
        if (ret === true) {
            active_user.session.forms[params.form][params.key] = params.value;
        } else {
            var str = form_lang.Get(active_user.lang, "ValueInvalid") + " " + ret;
            console.log(str);
            server.sendCallBack(env, {err: str});
        }
    }
    else
        active_user.session[params.key] = params.value;

    console.log(params);
};

methods.sessionApply = function(env, params){

    var active_user = checkUser(env);

    if(!active_user)
        return;

    if (params.form) {

        var activeForm = active_user.session.forms[params.form];
        if (!activeForm) {
            server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "UnknownForm")});
        } else {
            activeForm.activeInstance.apply(active_user, function (err) {
                if (err) {
                    server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Cannot apply the form. ", true) + err });
                } else {
                    server.sendCallBack(env, "OK");
                }
            });
        }

//        var active_user = checkUser(env);
//        console.log("sessionApply - form", active_user.session.forms[params.form]);
    }
    else {
        server.sendCallBack(env, {err: form_lang.Get(active_user.lang, "Nothing to Apply")});
    }

    console.log("sessionApply", params);
};


module.exports = methods;