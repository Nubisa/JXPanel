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

methods.sessionAdd = function(env, params){
    var active_user = checkUser(env);

    if(!active_user)
        return;

    if(params.form)
    {
        if(!active_user.session.forms[params.form])
            active_user.session.forms[params.form] = {};

        active_user.session.forms[params.form][params.key] = params.value;
    }
    else
        active_user.session[params.key] = params.value;

    console.log(params);
};

methods.sessionApply = function(env, params){
    var active_user = checkUser(env);

    if(!active_user)
        return;

    if(params.form){

    }
    else{
        server.sendCallBack(env, {err:form_lang.Get(active_user.lang, "Nothing to Apply")});
    }
};


module.exports = methods;