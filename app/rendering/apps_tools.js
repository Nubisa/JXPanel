/**
 * Created by root on 9/22/14.
 */

var path = require("path");
var fs = require("fs");
var src_install_dir = path.join(__dirname, "../../tools/apps");
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
        var appPath = path.join(dir, "jx_start.js");
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

exports.install = function(active_user, domain_name, appName, cb) {

    var data = exports.getData(domain_name, appName);
    if (data.err) {
        cb(data);
        return;
    }

    var zipFile = path.join(src_install_dir, data.appNameLowerCase + ".zip");
    var extra_folder = path.join(src_install_dir, data.appNameLowerCase);

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

        if (fs.existsSync(extra_folder)) {
            var cmd = "cp -r " + extra_folder + path.sep + "/* " + data.dir + path.sep;
            var res = jxcore.utils.cmdSync(cmd);
        }

        user_folders.markFile(data.dir, ids.uid, ids.gid);
        cb();
    });
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


exports.checkAppConfigChange = function(active_user, domain_name, json, cb) {

    if (json.jx_app_type === "custom") {
        cb();
        return;
    }

    if (json.jx_app_type === "NodeBB") {
        var data = exports.getData(domain_name, "NodeBB");
        if (!data.err && data.exists) {
            active_user.session.status = "Configuring NodeBB";

            var cfg = readNodeBBConfig(data);
            var mongo = cfg.mongo || {};
            var changed =
                cfg.port !== data.domain.port_http ||
                mongo.username !== json["nodebb_mongodb_username"] ||
                mongo.database !== json["nodebb_mongodb_database"] ||
                mongo.port !== json["nodebb_mongodb_port"] ||
                (json["nodebb_mongodb_pwd"] &&  (mongo.password !== json["nodebb_mongodb_pwd"]));

            if (changed || true) {
                var res = saveNodeBBConfig(active_user, data, json, cfg);
                runNodeBBSetup(active_user, data, json, res.cfg, function(err) {
                    cb(err, res.changed);
                });
            } else {
                cb();
            }

            return;
        }
    }

    cb();
};


var readNodeBBConfig = function(data) {

    var fname = path.join(data.dir, "config.json");
    var cfg = {};
    try {
        if (fs.existsSync(fname))
            cfg = JSON.parse(fs.readFileSync(fname).toString());
    } catch (ex) {
        //cannot read config - will create new one
    }

    return cfg;
};

var saveNodeBBConfig = function(active_user, data, json, org_config) {

    var _default = {
        "base_url": "http://" + data.domain.name,
        "port": data.domain.port_http, //no matter
        "bind_address": "0.0.0.0",
        "database": "mongo",
        "mongo": {
            "host": "127.0.0.1",
            "port": json["nodebb_mongodb_port"],
            "username": json["nodebb_mongodb_username"],
            "database": json["nodebb_mongodb_database"]
        }
    };

    var cfg = org_config;
    var org_pwd = cfg.mongo && cfg.mongo.password ? cfg.mongo.password : null;

    var changed = false;
    for (var a in _default) {
        if (cfg[a] !== _default[a]) {
            cfg[a] = _default[a];
            changed = true;
        }
    }

    var new_pwd = json["nodebb_mongodb_pwd"];
    if (new_pwd && new_pwd !== cfg.mongo.password) {
        cfg.mongo.password = new_pwd;
        changed = true;
    } else {
        cfg.mongo.password = org_pwd;
    }

    if (changed) {
        var fname = path.join(data.dir, "config.json");
        fs.writeFileSync(fname, JSON.stringify(cfg, null, 4));
        var ids = system_tools.getUserIDS(data.user.name);
        user_folders.markFile(fname, ids.uid, ids.gid);
    }

    return { cfg : cfg, changed : changed };
};


var runNodeBBSetup = function(active_user, data, json, cfg, cb) {

    var jxcomment = " // jxpanel_added"

    // modifying installation script: src/install.js
    var _path = path.join(data.dir, "src", "install.js");
    var contents = fs.readFileSync(_path).toString();
    if (contents.indexOf(jxcomment) === -1) {
        var values = {
            "admin:username" : "admin",
            "admin:email" : "x@x.x",
            "admin:password" : "admin",
            "admin:password:confirm" : "admin"
        };
        var str = 'questions = questions.concat(passwordQuestions);\n';
        contents = contents.replace(str, str + "      install.values = " + JSON.stringify(values) + ";" + jxcomment);
        fs.writeFileSync(_path, contents);
    }

    // modifying installation script: src/database/mongo.js
    var _path = path.join(data.dir, "src", "database", "mongo.js");
    var contents = fs.readFileSync(_path).toString();
    if (contents.indexOf(jxcomment) === -1) {
        var str = "name: 'mongo:username',\n";
        contents = contents.replace(str, str + "      'default': nconf.get('mongo:username')," + jxcomment);
        var str = "name: 'mongo:password',\n";
        contents = contents.replace(str, str + "      'default': nconf.get('mongo:password')," + jxcomment);
        fs.writeFileSync(_path, contents);
    }

    var last_error = false;

    var cmd = "'" + process.execPath + "' app.js --setup";
    var child = exec(cmd, {cwd: data.dir, maxBuffer: 1e7}, function(error, stdout, stderr) {

        var ids = system_tools.getUserIDS(data.user.name);
        user_folders.markFile(data.dir, ids.uid, ids.gid);
        cb(last_error);
    });

    child.stdout.on('data', function (data) {
        console.log('stdout: ' + data);
        writeNewLine(data.toString());
    });

    child.stderr.on('data', function (data) {
        data = data.toString();
        console.log('stderr: ' + data);

        if (data.indexOf("rror") !== -1)
            last_error = data.split("\n")[0];
    });

    var writeNewLine = function() {

        setTimeout(function() {
            try {
                child.stdin.write("\n");
            } catch (ex) {
            }
        }, 500);
    };
};