/**
 * Created by root on 9/22/14.
 */

var path = require("path");
var fs = require("fs");
var tools_folder = path.join(__dirname, "../../tools");
var hosting_tools = require("../hosting_tools");
var form_lang = require('../definitions/form_lang');
var user_folders = require("../definitions/user_folders");
var database = require("../install/database");
var system_tools = require("../system_tools");
var exec = require("child_process").exec;


exports.getData = function(domain_name, appName, checkIfExists) {

    var appName = appName.toLowerCase();

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err : "DomainNotFound" };

    var user = database.getUser(domain.owner);
    if (!user)
        return { err : "UserUnknown" };

    var user_home = user_folders.getUserPath(user.plan, user.name);
    if (!fs.existsSync(user_home)) {
        return { err : "UserHomeDirNotExists" };
    }

    var domain_home = hosting_tools.appGetHomeDirByPlanAndUser(user.plan, user.name, domain_name);

    var dir = path.join(domain_home, "_apps", appName);
    if (appName === "nodebb")
        var appPath = path.join(dir, "app.js");
    else
        var appPath = path.join(dir, "index.js");

    var exists = fs.existsSync(appPath);
    if (checkIfExists && ! exists)
        return { err : "JXcoreAppAppNotInstalled|" + appName };

    return { user : user, user_home : user_home, dir : dir, exists : exists, path : appPath, appNameLowerCase : appName, domain : domain };
};



exports.getAppStatus = function(active_user, domain_name, appName) {

    var data = exports.getData(domain_name, appName);
    if (data.err)
        return data;


    var btnInstall = '<button type="button" class="btn btn-labeled btn-success" onclick="return utils.jxAppInstall(\'' + appName + '\', true);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-play"></i></span>'
        + form_lang.Get(active_user.lang, "Install", true) + '</button>';

    var btnUninstall = '<button type="button" class="btn btn-labeled btn-danger" onclick="return utils.jxAppInstall(\'' + appName + '\', false);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-stop"></i></span>'
        + form_lang.Get(active_user.lang, "Uninstall", true) + '</button>';

    var info = '<br><span class="note">' + data.dir.replace(data.user_home, ".") + '</span><br>';

    var str = form_lang.GetBool(active_user.lang, data.exists, "Installed", "Not installed");
    if (data.exists) str += btnUninstall + info; else str += btnInstall;

    return str;
};


exports.installGhost = function(active_user, domain_name, dir, cb) {

    var zipFile = path.join(tools_folder, "Ghost.zip");

    var data = exports.getData(domain_name, "ghost");
    if (data.err) {
        cb(data);
        return;
    }

    var fullDir = data.dir;
    var parent = path.dirname(fullDir);

    var ids = system_tools.getUserIDS(user.name);

    if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent);
        user_folders.markFile(parent, ids.uid, ids.gid);
    }

    exec("unzip -u " + zipFile + " Ghost/\*", {cwd: parent, maxBuffer: 1e7}, function (err, stdout, stderr) {

        if (err) {
            cb({err : err });
            return;
        }

        var cmd = "mv " + path.join(parent, "Ghost") + " " + fullDir;
        jxcore.utils.cmdSync(cmd);

        if (!fs.existsSync(fullDir)){
            cb( { err : "Could not unzip Ghost package" } );
            return;
        }

        user_folders.markFile(fullDir, ids.uid, ids.gid);

        cb(false);
    });
};



exports.install = function(active_user, domain_name, appName, cb) {

    var data = exports.getData(domain_name, appName);
    if (data.err) {
        cb(data);
        return;
    }

    var zipFile = path.join(tools_folder, data.appNameLowerCase + ".zip");

    if (!fs.existsSync(zipFile)) {
        cb({err : "JXcoreAppAppNoInstallationFile"});
        return;
    }

    var parent = path.dirname(data.dir);

    var ids = system_tools.getUserIDS(data.user.name);

    if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent);
        user_folders.markFile(parent, ids.uid, ids.gid);
    }

    // there is a folder expected inside zip file, name Ghost, NodeBB or Meteor, which is appName
    var cmd = "unzip -u " + zipFile + " " + appName + "/\*";
    exec(cmd, {cwd: parent, maxBuffer: 1e7}, function (err, stdout, stderr) {

        if (err) {
            console.error("JXcoreAppAppColdNotInstall", err, stdout, stderr);
            cb({err : "JXcoreAppAppColdNotInstall" });
            return;
        }

        var cmd = "mv " + path.join(parent, appName) + " " + data.dir;
        var res = jxcore.utils.cmdSync(cmd);

        if (!fs.existsSync(data.dir)){
            console.error(res.out);
            cb( { err : "JXcoreAppAppColdNotInstall" } );
            return;
        }

        user_folders.markFile(data.dir, ids.uid, ids.gid);

        var res = customize(data);
        if (res.err)
            cb(res.err);

        cb(false);
    });
};


var customize = function(data) {


    if (data.appNameLowerCase === "nodebb") {

        var cfg = {
            "base_url": "http://" + data.domain.name,
            "port": "8080", //no matter
            "secret": "top_secret",
            "bind_address": "0.0.0.0",
            "database": "redis",
            "redis": {
                "host": "127.0.0.1",
                "port": "6379",
                "password": "pwd",
                "database": "0"
            },
            "bcrypt_rounds": 12,
            "upload_path": "/public/uploads",
            "use_port": false,
            "relative_path": ""
        }

        var fname = path.join(data.dir, "config.json");
        fs.writeFileSync(fname, JSON.stringify(cfg, null, 4));
        return true;
    }

    return true;
};


exports.uninstall = function(active_user, domain_name, appName, cb) {

    var data = exports.getData(domain_name, appName);
    if (data.err) {
        cb(data);
        return;
    }

    var remove = function(data, cb) {

        var cmd = "rm -rf " + data.dir;
        exec(cmd, { maxBuffer: 1e7}, function (err, stdout, stderr) {

            if (fs.existsSync(data.dir)){
                console.error("JXcoreAppAppColdNotUnInstall", err, stdout, stderr);
                cb( { err : "JXcoreAppAppColdNotUnInstall" } );
                return;
            }

            cb(false);
        });
    };

    if (data.domain.jx_app_type !== appName) {
        remove(data, cb);
        return;
    }

    // stopping the app if it's running
    hosting_tools.appStartStop(false, domain_name, function(err) {

        if (err) {
            cb({ err : err })
            return;
        }

        remove(data, cb);
    });
};


exports.installUninstall = function(active_user, domain_name, appName, install, cb) {

    if (install)
        exports.install(active_user, domain_name, appName, cb);
    else
        exports.uninstall(active_user, domain_name, appName, cb);
};