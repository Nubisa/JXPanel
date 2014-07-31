var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');
var form_lang = require('./form_lang');
var site_defaults = require('./site_defaults');
var osinfo = require('../install/os_info').OSInfo();
var db = require('../install/database');

exports.markFile = function(target, uid, gid){
    var res = jxcore.utils.cmdSync("chown -R " + uid + ":" + gid + " " + target);
    if(res.exitCode != 0){
        return res.out;
    }
    return null;
};

exports.getUserPath = function(plan_name, user_name){
    var arr = [];
    var subplan = plan_name;
    while(subplan && subplan.length){
        var name = new Buffer(subplan).toString('base64').replace(/=/g,"").replace(/\+/g, "");
        arr.unshift(name);
        subplan = db.getParentPlanName(subplan);
    }

    var location = osinfo.appsFolder + pathModule.sep + arr.join(pathModule.sep) + pathModule.sep + user_name;

    return location;
};

exports.createUserHome = function(plan_name, user_name){

    var location = exports.getUserPath(plan_name, user_name);

    console.log("creating user home at", location);
    var res = jxcore.utils.cmdSync("mkdir -p " + location);

    if(res.exitCode!=0){
        return {err:res.out};
    }

    jxcore.utils.cmdSync("chmod -R o-rwx " + location);

    return {home:location};
};