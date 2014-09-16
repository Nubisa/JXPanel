/**
 * Created by root on 9/16/14.
 */

var path = require("path");
var fs = require("fs");
var site_defaults = require("../definitions/site_defaults");

var ftp_dir = path.join(site_defaults.apps_folder, "ftp");
var pid_file = path.join(site_defaults.apps_folder, "ftp/etc/pid");
var conf_file = path.join(site_defaults.apps_folder, "ftp/etc/proftpd.conf");

exports.conf_file = conf_file;

var clog = jxcore.utils.console.log;

exports.start = function() {
    clog("Starting FTP server", "green");

    var ret = jxcore.utils.cmdSync(path.join(ftp_dir, "sbin/proftpd"));
    if (ret.exitCode)
        return { err : "Cannot start ftp server: " + ret.out };

    if (!fs.existsSync(pid_file))
        return { err : "Cannot start ftp server: pid file was not found." };

    return true;
};

exports.restart = function() {
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

    return true;
};

var allowedUsers = [];
var conf_str = null;

var readConfigOnce = function() {

    if (conf_str)
        return false;

    if (!fs.existsSync(conf_file))
        return { err : "FTP config file does not exists."};

    conf_str = fs.readFileSync(conf_file).toString();

    // match1[1] returns e.g.:
    // DenyAll
    // AllowUser OR kris25,nubisa
    var match1 = /<Limit LOGIN>([\s\S]*?)<\/Limit>/g.exec(conf_str);

    var allowedUsers_str = "";
    if (match1 && match1[1]) {
        var match2 = /AllowUser OR([\s\S]*?)$/g.exec(match1[1]);
        if (match2 && match2[1])
            allowedUsers_str = match2[1].trim();
    }

    allowedUsers = allowedUsers_str ? allowedUsers_str.split(",") : [];
    return true;
};


var saveConfig = function() {

    var tmp = "\n  DenyAll\n";

    if (allowedUsers.length)
        tmp += "  AllowUser OR " + allowedUsers.join(",") + "\n";

    conf_str = conf_str.replace(/<Limit LOGIN>([\s\S]*?)<\/Limit>/, "<Limit LOGIN>" + tmp + "<\/Limit>");
    console.log("tmp", tmp);

    console.log("allowedUsers", allowedUsers);

    fs.writeFileSync(conf_file, conf_str);

    var res = exports.restart();
    if (res.err) {
        console.error(res.err);
        return res;
    }

    return true;
};

exports.allowUser = function(user_name) {
    var res = readConfigOnce();
    if (res.err)
        return res;

    if (allowedUsers.indexOf(user_name) === -1) {
        allowedUsers.push(user_name);
        return saveConfig();
    }

    return true;
};

exports.denyUser = function(user_name) {
    var res = readConfigOnce();
    if (res.err)
        return res;

    var index = allowedUsers.indexOf(user_name);
    if (index !== -1) {
        allowedUsers.splice(index, 1);
        return saveConfig();
    }

    return true;
};
