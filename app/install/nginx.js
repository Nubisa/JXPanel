var fs = require('fs');
var pathModule = require('path');
var site_defaults = require("../definitions/site_defaults");
var ip_tools = require("./../ip_tools");
var system_tools = require("./../system_tools");

var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var nginx_dir = site_defaults.apps_folder + sep + "nginx";
var nginx_process =  nginx_dir + sep + "sbin" + sep + "nginx";
var nginx_pid_file = pathModule.join(nginx_dir, "logs/nginx.pid");

var nginxconf = require("../spawner/nginxconf");
var server = require("jxm");

exports.needsReload = false;
exports.startError = null;


var getPorts = function() {
    var opts = null;

    var dev_config = pathModule.join(__dirname, '../app.dev_config');
    if(fs.existsSync(dev_config)){
        opts = JSON.parse(fs.readFileSync(dev_config) + "");
    }

    return {
        http : opts && opts.port ? opts.port : server.getConfig("httpServerPort") || 80,
        https : opts && opts.securePort ? opts.securePort : server.getConfig("httpsServerPort") || 443
    }
};

exports.updateConfFile = function() {

    var conf_file = nginx_dir + sep + "conf" + sep + "nginx.conf";
    if (fs.existsSync(conf_file)) {
        var str = fs.readFileSync(conf_file).toString();
        var include = "include jxcore/*.conf;";
        if (str.indexOf(include) === -1) {
            var pos = str.lastIndexOf("}");
            if (pos !== -1)
                str = str.slice(0, pos -1) + "\n\t" + include + "\n" + str.slice(pos);
            fs.writeFileSync(conf_file, str);
        }
    }

    if (!fs.existsSync(site_defaults.dirNginxConfigs))
        fs.mkdirSync(site_defaults.dirNginxConfigs);

    var conf_file_default = pathModule.join(site_defaults.dirNginxConfigs, "_default.conf");

    var contents = "";
    if (fs.existsSync(conf_file_default))
        contents = fs.readFileSync(conf_file_default).toString();

    var cfg = nginxconf.createDefaultConfig( {
        key :  site_defaults.dirMonitorCertificates + "server.key",
        crt :  site_defaults.dirMonitorCertificates + "server.crt"
    }, ip_tools.getAllIPs("both"));

    if (contents !== cfg)
        fs.writeFileSync(conf_file_default, cfg);
};


exports.isRunning = function() {
    return system_tools.processExistsByPidFile(nginx_pid_file);
};

exports.prepare = function(){
    clog("Preparing NGINX for the first time usage", "green");
    jxcore.utils.cmdSync("service nginx stop");


    var ret = jxcore.utils.cmdSync("chmod 755 "+nginx_process);
    if(ret.exitCode != 0){
        console.error(ret.out);
        process.exit(ret.exitCode)
    }

    exports.updateConfFile();
};

// returns true if it's successful otherwise returns ret{exitCode, err}
exports.start = function(verbose){

    if (verbose)
        clog("Starting NGINX", "green");

    var ret = jxcore.utils.cmdSync(nginx_process + " -p "+ nginx_dir + " 2>&1");
    if(ret.exitCode !== 0) {
        exports.startError = "Could not start nginx:" + ret.out;
        ret.err = exports.startError;
        return ret;
    }

    if (verbose)
        clog("Started", "blue");
    exports.startError = null;
    return true;
};


exports.startIfStopped = function(verbose, showMessageIfRunning){

    var running = exports.isRunning();
    if (running) {
        if (verbose && showMessageIfRunning)
            console.log("Nginx is already running.");
        return true;
    }

    var ret = exports.start(verbose);
    if (ret.err) {
        if (verbose)
            console.error(ret.err);
        return ret;
    }

    return true;
};

// returns true if it's successful otherwise returns ret{exitCode, out}
exports.stop = function(verbose){
    if (verbose)
        clog("Stopping NGINX", "green");

    var ret = jxcore.utils.cmdSync(nginx_process + " -s stop -p "+ nginx_dir);
    if(ret.exitCode !== 0) {
        ret.err = "Could not stop nginx: " + ret.out;
        return ret;
    }

    if (verbose)
        clog("Stopped", "blue");
    return true;
};


exports.stopIfStarted = function(verbose, showMessageIfStopped){

    var running = exports.isRunning();
    if (!running) {
        if (verbose && showMessageIfStopped)
            console.log("Nginx is already stopped.");
        return true
    }

    var ret = exports.stop(verbose);
    if (ret.err) {
        if (verbose)
            console.error(ret.err);
        return ret;
    }

    return true;
};

// returns null if it's successful otherwise returns string err
exports.reload = function(onlyIfNeeded, silent){

    if (onlyIfNeeded && !exports.needsReload)
        return null;

    if (!exports.isRunning()) {
        if (!silent)
            console.log("Nginx is not running.");

        return null;
    }

    if (!silent)
        clog("Reloading NGINX", "green");

    exports.updateConfFile();

    var ret = jxcore.utils.cmdSync(nginx_process + " -s reload -p "+ nginx_dir + " 2>&1");
    if(ret.exitCode !== 0) {
        if (!silent)
            console.error("Not reloaded:", ret.out);
        // removing path from output to the user
        var str = ret.out.replace(new RegExp(nginx_dir, "ig"), "[...]");
        return str;
    }

    exports.needsReload = false;
    if (!silent)
        clog("Reloaded", "blue");

    return null;
};


// it stops nginx (if running) and then starts again
exports.restart = function(verboseStop, verboseStart) {

    var ret = true;
    var running = exports.isRunning();

    if (running) {
        ret = exports.stop(verboseStop);
        if (ret.err) {
            if (verboseStop)
                console.error(ret.err);
            return ret;
        }
    }

    ret = exports.start(verboseStart);
    if (ret.err) {
        if (verboseStart)
            console.error(ret.err);
        return ret;
    }

    return true;
};


exports.testConfig = function(configString) {

    var testRootDir = pathModule.join(site_defaults.apps_folder, "nxginx_test_" + Date.now());

    var dirs = [];
    dirs.push(testRootDir)
    dirs.push(pathModule.join(testRootDir, "conf"));
    dirs.push(pathModule.join(testRootDir, "conf", "jxcore"));
    dirs.push(pathModule.join(testRootDir, "logs"));

    for(var o in dirs) {
        if (!fs.existsSync(dirs[o]))
            fs.mkdirSync(dirs[o]);
    }

    // copying original nginx.conf file
    var cmd = "cp " + pathModule.join(site_defaults.apps_folder, "nginx/conf") + sep + "* " + pathModule.join(testRootDir, "conf") + sep;
    jxcore.utils.cmdSync(cmd);

    var logFile = pathModule.join(testRootDir, "logs/error.log")
    if (fs.existsSync(logFile))
        fs.unlinkSync(logFile);

    var testFile = pathModule.join(testRootDir, "conf/jxcore", Date.now() +".conf");
    fs.writeFileSync(testFile, configString);

    var ret = jxcore.utils.cmdSync(nginx_process + " -t -p "+ testRootDir);

    var err = false;
    if(ret.exitCode !== 0) {
        var log = fs.existsSync(logFile) ? fs.readFileSync(logFile).toString() : ret.out;
        log = log.replace(new RegExp(testFile, "g"), "test file");

        var arr = log.split("\n");
        for(var o in arr) {
            var pos = arr[o].indexOf(": ");
            if (pos !== -1)
                arr[o] = arr[o].slice(pos + 2);
        }

        err = arr.join(". ");
    }

    // cleaning up
    var cmd = "rm -rf " + testRootDir;
    jxcore.utils.cmdSync(cmd)

    return {err : err};
};


exports.removeAllConfigs = function() {

    if (!fs.existsSync(site_defaults.dirNginxConfigs))
        return;

    var files = fs.readdirSync(site_defaults.dirNginxConfigs);
    for (var o in files) {
        if (files[o] === "_default.conf") continue;

        try {
            fs.unlinkSync(pathModule.join(site_defaults.dirNginxConfigs, files[o]));
            exports.needsReload = true;
        } catch (ex) {
        }
    }
};