var form_lang = require('../definitions/form_lang');
var _active_user = require('../definitions/active_user');
var system_tools = require('../system_tools');
var server = require('jxm');
var os_info = require("./../install/os_info");
var path = require("path");

// site defaults are only ENGLISH!
exports.EN = {
    title: "JXPanel",
    panelName : "JXPanel",
    dashboardTitle:function(lang, active_user){
        var str = form_lang.Get(lang, "WelcomeDashboard", null, [active_user.nameTitle]);

        return str;
    },
    dashboardMessage: function(lang, active_user){
        return "Some text here";
    },
    getOSInfo:function(lang, active_user){
        return form_lang.Get(lang, system_tools.getOSInfo(), true);
    },
    getUniqueId: function(lang, active_user){
        return jxcore.utils.uniqueId();
    }
};

var getOSDetails = function(lang, env){
    system_tools.getTop(true, env, function(val){
        var ret_val = val.res;
        var _env = val.e;

        var details = form_lang.Get(lang, ret_val, true);

        var lst = details.match(/([0-9]+[\/]+[0-9]+[\/]+[0-9]+)/g);
        for(var o in lst){
            details = details.replace(lst[o], "");
        }

        lst = details.match(/([0-9]+[:]+[0-9]+[:]*[0-9]*)/g);
        for(var o in lst){
            details = details.replace(lst[o], "");
        }

        lst = details.match(/([0-9]+[.]*[0-9]+[%BMGK]*)/g);
        for(var o in lst){

            details = details.replace(lst[o], "<span style='color:#004d60'>"+lst[o]+"</span>");
        }

        lst = details.match(/([ a-zA-Z]+[:]+[ a-zA-Z]+[:]+)/g);
        for(var o in lst){
            var str = lst[o].replace(/:/g, "");
            str += ":";
            details = details.replace(lst[o], str);
        }

        lst = details.match(/([ a-zA-Z(())]+[:]+)/g);

        for(var o in lst){
            if(lst[o] != "color:"){
                details = details.replace(lst[o], "<br/><span style='color:#003333'><strong>"+lst[o] + "</strong></span>");
            }
        }
        
        if(!system_tools.IsOSX){
        	details = details.replace(/top[ ]+\-[ ]+up/, "<br/><span style='color:#003333'><strong>Up-time: <strong></span>");
        }
        
        details = details.replace(/,/g, "&nbsp;");

        server.sendCallBack(_env, {html:details});
    });
};

exports.defineMethods = function(){
    server.addJSMethod("getOSDetails", function(env, params){
       var active_user = _active_user.getUser(env.SessionID);
        if(!active_user){
            server.sendCallBack(env, {err:form_lang.Get("EN", "Access Denied"), relogin:true});
            return;
        }

        getOSDetails(active_user.lang, env);
    });
};

exports.dirNativeModules = path.join(os_info.apps_folder, "native_modules" ) + path.sep;
exports.dirAppConfigs = path.join(os_info.apps_folder, "app_configs" ) + path.sep;
exports.dirMonitorCertificates = path.join(__dirname, "../spawner") + path.sep;
exports.dirNginxConfigs = path.join(os_info.apps_folder, "nginx/conf_jx") + path.sep;
exports.defaultAppMinPort = 10000;
exports.defaultAppMaxPort = 20000;
exports.defaultMaximum = 1e9;  // don't change it, otherwise db should be refreshed


//{{defaults.LABELHERE}}