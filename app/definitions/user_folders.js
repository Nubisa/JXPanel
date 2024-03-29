var fs = require('fs');
var pathModule = require('path');
var _active_user = require('./active_user');
var form_lang = require('./form_lang');
var site_defaults = require('./site_defaults');
var db = require('../install/database');
var system_tools = require('../system_tools');

exports.markFile = function(target, uid, gid){
    var res = jxcore.utils.cmdSync("chown -R " + uid + ":" + gid + " " + target);
    if(res.exitCode != 0){
        return res.out;
    }
    return null;
};

exports.getUserPathSize = function(user_name){
    var users = db.getUsersByUserName(user_name, 1e7);
    var pl = db.getUser(user_name);
    if(!pl){
        console.error(user_name, "wasn't exist in database");
        process.exit(-1);
    }
    var plan = pl.plan;
    var total = system_tools.getDiskUsageSync(exports.getUserPath(plan, user_name));
    for(var o in users){
        pl = db.getUser(users[o]);
        if(!pl){
            console.error(user_name, "wasn't exist in database");
            process.exit(-1);
        }
        plan = pl.plan;
        total += system_tools.getDiskUsageSync(exports.getUserPath(plan, users[o]));
    }

    return total;
};

exports.getUserPath = function(plan_name, user_name){
    var arr = [];
    var subplan = plan_name;
    while(subplan && subplan.length){
        var name = new Buffer(subplan).toString('base64').replace(/=/g,"").replace(/\+/g, "");
        arr.unshift(name);
        subplan = db.getParentPlanName(subplan);
    }

    var location = site_defaults.apps_folder + pathModule.sep + arr.join(pathModule.sep) + pathModule.sep + (user_name || "");

    return location;
};

exports.getPlanPath = function(plan_name) {
   return exports.getUserPath(plan_name);
};

exports.createUserHome = function(plan_name, user_name){

    var location = exports.getUserPath(plan_name, user_name);

    console.log("creating user home at", location);
    var res = exports.createUserFolder(location);
    if (res.err)
        return res;

    return {home:location};
};

exports.createUserFolder = function(location) {

    var res = jxcore.utils.cmdSync("mkdir -p " + location);

    if(res.exitCode!=0){
        return {err:res.out};
    }

    // kris changed: allowing x for user home dir.
    // changed from o-rwx into o-rw+x
    // otherwise nginx could not reach jxcore_logs/index.txt
    jxcore.utils.cmdSync("chmod -R o-rw+x " + location);

    return true;
};


exports.moveUserHome = function(user_name, new_plan_name) {

    var new_home = exports.getUserPath(new_plan_name, user_name);
    var new_profile_dir = pathModule.dirname(new_home); // plan's folder

    if (!fs.existsSync(new_profile_dir)) {
        var res = exports.createUserFolder(new_profile_dir);
        if (res.err)
            return res;
    }

    var cmd = 'usermod -m -d ' + new_home + ' ' + user_name;
    var res = jxcore.utils.cmdSync(cmd);
    if (res.exitCode) {
        console.error(cmd, res);
        return {err:res.out};
    }

    // extra check
    if (!fs.existsSync(new_home)) {
        var res = exports.createUserHome(new_plan_name, user_name);
        if (res.err)
            return res;

        if (!fs.existsSync(new_home))
            return { err:"UserHomeDirNotMoved" };
    }

    var ids = system_tools.getUserIDS(user_name);
    if (ids)
        exports.markFile(new_home, ids.uid, ids.gid);

    // user need to re-login
    _active_user.clearUserByName(user_name);

    return true;
};