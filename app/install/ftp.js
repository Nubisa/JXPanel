/**
 * Created by root on 9/16/14.
 */

var path = require("path");
var fs = require("fs");
var site_defaults = require("../definitions/site_defaults");
var system_tools = require("./../system_tools");
var database = require("./database");

var ftp_dir = path.join(site_defaults.apps_folder, "ftp");
var pid_file = path.join(site_defaults.apps_folder, "ftp/etc/pid");
var conf_file = path.join(site_defaults.apps_folder, "ftp/etc/proftpd.conf");

exports.conf_file = conf_file;

var clog = jxcore.utils.console.log;

exports.isRunning = function() {
    return system_tools.processExistsByPidFile(pid_file);
};

exports.start = function() {
    clog("Starting FTP server", "green");

    var ret = jxcore.utils.cmdSync(path.join(ftp_dir, "sbin/proftpd") + " 2>&1");
    if (ret.exitCode) {
        var str = "Cannot start ftp server: " + ret.out;
        return { err : str};
    }

    if (ret.out && ret.out.toString().indexOf("warning"))
        console.log(ret.out);

    clog("Started", "blue");

    return true;
};

exports.startIfStopped = function(showMessageIfRunning){

    var running = exports.isRunning();
    if (running) {
        if (showMessageIfRunning)
            console.log("FTP engine is already running.");
        return true;
    }

    var ret = exports.start();
    if (ret.err) {
        console.error(ret.err);
        return ret;
    }

    return true;
};

exports.restart = function() {

    if (!exports.isRunning())
        return true;

    var cmd = "kill -HUP `cat " + pid_file + "`";
    var ret = jxcore.utils.cmdSync(cmd);
    if (ret.exitCode)
        return { err : "Cannot restart ftp server: " + ret.out }

    return true;
};

exports.stop = function() {

    clog("Stopping FTP server", "red");

    if (!fs.existsSync(pid_file))
        return { err : "Cannot stop ftp server: pid file was not found." };

    var cmd = "kill -TERM `cat " + pid_file + "`";
    var ret = jxcore.utils.cmdSync(cmd);
    if (ret.exitCode)
        return { err : "Cannot stop ftp server: " + ret.out }

    clog("Stopped", "blue");
    return true;
};


exports.stopIfStarted = function(showMessageIfStopped){

    var running = exports.isRunning();
    if (!running) {
        if (showMessageIfStopped)
            console.log("FTP engine is already stopped.");
        return true
    }

    var ret = exports.stop();
    if (ret.err) {
        console.error(ret.err);
        return ret;
    }

    return true;
};

var allowedUsers = [];
var conf_str = null;

var readConfigOnce = function() {

    if (conf_str)
        return false;

    if (!fs.existsSync(conf_file))
        return { err : "FTP config file does not exists."};

    // need to read users ftp access from db on panel start
    var users = database.getUsersByPlanName(database.unlimitedPlanName, 1e7);
    for (var o in users) {
        var user = database.getUser(users[o]);
        if (user.ftp_access)
            allowedUsers.push(user.name);
    }

    conf_str = fs.readFileSync(conf_file).toString();

    // match1[1] returns e.g.:
    // DenyAll
    // AllowUser OR kris25,nubisa
    //var match1 = /<Limit LOGIN>([\s\S]*?)<\/Limit>/g.exec(conf_str);
    //
    //var allowedUsers_str = "";
    //if (match1 && match1[1]) {
    //    var match2 = /AllowUser OR([\s\S]*?)$/g.exec(match1[1]);
    //    if (match2 && match2[1])
    //        allowedUsers_str = match2[1].trim();
    //}
    //
    //allowedUsers = allowedUsers_str ? allowedUsers_str.split(",") : [];
    return true;
};


var saveConfig = function() {

    var tmp = "\n  DenyAll\n";

    if (allowedUsers.length)
        tmp += "  AllowUser OR " + allowedUsers.join(",") + "\n";

    var new_cfg = conf_str.replace(/<Limit LOGIN>([\s\S]*?)<\/Limit>/, "<Limit LOGIN>" + tmp + "<\/Limit>");
    new_cfg = new_cfg.trim() + "\n";

    if (new_cfg !== conf_str) {
        fs.writeFileSync(conf_file, new_cfg);

        var res = exports.restart();
        if (res.err) {
            console.error(res.err);
            return res;
        }
        conf_str = new_cfg;
    }

    return true;
};

exports.allowUser = function(user_name, verbose) {
    var user = database.getUser(user_name);
    if (!user)
        return { err : "UserUnknown|: " + user_name };

    var res = readConfigOnce();
    if (res.err)
        return res;

    if (!user.ftp_access) {
        if (allowedUsers.indexOf(user_name) === -1)
            allowedUsers.push(user_name);

        user.ftp_access = true;
        database.updateDBFile();
        if (verbose)
            system_tools.console.log("FTP access was successfully granted for user: " + user_name);
    } else {
        if (verbose)
            system_tools.console.log("FTP access is already granted for user: " + user_name);
    }

    return saveConfig();
};

exports.denyUser = function(user_name, verbose) {
    var user = database.getUser(user_name);
    if (!user)
        return { err : "UserUnknown|: " + user_name };

    var res = readConfigOnce();
    if (res.err)
        return res;

    if (user.ftp_access) {
        var index = allowedUsers.indexOf(user_name);
        if (index !== -1)
            allowedUsers.splice(index, 1);

        user.ftp_access = false;
        database.updateUser(user_name, user);
        //database.updateDBFile();
        if (verbose)
            system_tools.console.log("FTP access was successfully denied for user: " + user_name);
    } else {
        if (verbose)
            system_tools.console.log("FTP access is already denied for user: " + user_name);
    }

    return saveConfig();
};
