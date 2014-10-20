/**
 * Created by root on 10/15/14.
 */


var fs = require("fs");
var path = require("path");
var db = require("./db");
var exec = require('child_process').exec;

var osInfo = jxcore.utils.OSInfo();

//var isService = function() {
//
//    var res = jxcore.utils.cmdSync("service mongod");
//    var out = res.out.toString().trim();
//    var ret = out.indexOf("unrecognized") === -1;
//    return ret;
//};


var isInstalled = function() {

    var res = jxcore.utils.cmdSync("which mongod");
    var _path = res.out.toString().trim();
    var installed = _path && fs.existsSync(_path);
    return installed;
};

//var isRunning = function() {
//
//    // for now tested only on ubuntu
//    var res = jxcore.utils.cmdSync("service mongod status");
//    var out = res.out.toString().trim();
//    var running = out.indexOf("start/running") !== -1;
//    return running;
//};


exports.mongoStatus = function(addonFactory, cb) {

    var ret = { online : false, installed : false, adminExists : false };
    ret.installed = isInstalled();

    db.ConnectAsAdmin(function(err, db, connectedWithoutAuth) {

        ret.online = connectedWithoutAuth;
        ret.adminExists = !err;

        ret.html = addonFactory.html.tickMark(ret.installed, "Installed", "NotInstalled");

        if (ret.installed || ret.online)
            ret.html += "<br>" + addonFactory.html.tickMark(ret.online, "Online", "Offline");

        if (ret.installed && ret.online)
            ret.html += "<br>" + addonFactory.html.tickMark(ret.adminExists, "Admin user exists", "Admin user does not exists");

        cb(ret);
    });
};


var getConfigPath = function() {

    var dirData = path.join(__dirname, "data");

    console.error("dirData", dirData);
    if (!fs.existsSync(dirData))
        fs.mkdirSync(dirData);

    var configPath = path.join(dirData, "mongodb.conf");
    //if (!fs.existsSync(configPath))
    {
        var cfg = [
                'dbpath = ' + dirData,
                'logpath = ' + path.join(dirData, "mongo.log"),
                'bind_ip = 127.0.0.1',
                'port = ' + db.port,
                'auth = true'
                ];

        fs.writeFileSync(configPath, cfg.join("\n"));
    }

    return configPath;
};

exports.mongoStop = function() {

    var configPath = getConfigPath();

    var res = jxcore.utils.cmdSync("mongod -f " + configPath + " --shutdown");
    if (res.exitCode) {
        var str = "Cannot shutdown MongoDB instance.";
        console.error(str, res.out);
        return { err : str };
    }
    return true;
};


exports.mongoStart = function() {

    var configPath = getConfigPath();
    var cmd = "mongod -f " + configPath;

    // system sync needed to run mongo in background
    var res = jxcore.utils.systemSync(cmd + " --repair && " + cmd + " &");
    if (res)
        return { err : "Cannot start MongoDB engine. Exit code: " + res}

    return true;
};


exports.mongoInstall = function(addonFactory, cb) {

    if (isInstalled())
        return { err : "Mongo DB is already installed" };

    var cmds = [];

    // for ubuntu
    if (osInfo.isUbuntu)
        var cmds = [
            'apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10',
            "echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list",
            'apt-get update',
            'apt-get install -y mongodb-org'
        ];

    if (!cmds.length)
        return { err : "Installing MongoDB on this platform is not supported." }

    var msg = "Installing MongoDB";
    addonFactory.status.set(msg);
    var child = exec(cmds.join(";"), { maxBuffer: 1e7}, function (err, stdout, stderr) {

        if (err) {
            cb(err.toString() + " " + stdout + " " + stderr)
            return;
        }

        // waiting for engine to start
        setTimeout(function() {
            db.CreateAdmin(cb);
        }, 2000);
    });

    child.stdout.on('data', function (data) {
        addonFactory.status.set(msg);
    });

    child.stderr.on('data', function (data) {
        addonFactory.status.set("Error: " + data.toString());
    });
};