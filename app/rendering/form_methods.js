var _active_user = require('../definitions/active_user');
var server = require('jxm');
var methods = {};


methods.sessionAdd = function(env, params){
    var active_user = _active_user.getUser(env.SessionID, false);

    if(!active_user){
       server.sendCallBack(env, {err:"User session is not available or expired"});
       return;
    }

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


module.exports = methods;