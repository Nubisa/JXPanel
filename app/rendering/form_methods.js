var _active_user = require('../definitions/active_user');
var methods = {};


methods.sessionAdd = function(env, params){
    var active_user = _active_user.getUser("XXX");
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