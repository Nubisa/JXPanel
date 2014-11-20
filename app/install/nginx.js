var fs = require('fs');
var pathModule = require('path');
var os_info = jxcore.utils.OSInfo();
var site_defaults = require("../definitions/site_defaults");

var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var nginx_dir = site_defaults.apps_folder + sep + "nginx";
var nginx_process =  nginx_dir + sep + "sbin" + sep + "nginx";

var nginxconf = require("../spawner/nginxconf");
var server = require("jxm");

exports.needsReload = false;

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

var updateConfFile = function() {

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

    var cfg = nginxconf.createDefaultConfig( { key :  site_defaults.dirMonitorCertificates + "server.key", crt :  site_defaults.dirMonitorCertificates + "server.crt"});

    if (contents !== cfg)
        fs.writeFileSync(conf_file_default, cfg);
};


exports.prepare = function(){
    clog("Preparing NGINX for the first time usage", "green");
    jxcore.utils.cmdSync("service nginx stop");


    var ret = jxcore.utils.cmdSync("chmod 755 "+nginx_process);
    if(ret.exitCode != 0){
        console.error(ret.out);
        process.exit(ret.exitCode)
    }

    updateConfFile();
};

// returns null if it's successful otherwise returns ret{exitCode, out}
exports.start = function(){
    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH || os_info.isSuse){
        clog("Starting NGINX", "green");
        var ret = jxcore.utils.cmdSync(nginx_process + " -p "+ nginx_dir);
        if(ret.exitCode !== 0) {
            console.error("Could not start nginx:", ret.out);
            return ret;
        }

        clog("Started", "blue");
        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};

// returns false if it's successful otherwise returns ret{exitCode, out}
exports.startIfStopped = function(){

    var ret = exports.reload(false, true);
    if (ret) {
        return exports.start();
    }
    return false;
};

// returns null if it's successful otherwise returns ret{exitCode, out}
exports.stop = function(){
    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH || os_info.isSuse){
        clog("Stopping NGINX", "green");

        var ret = jxcore.utils.cmdSync(nginx_process + " -s stop -p "+ nginx_dir);
        if(ret.exitCode !== 0) {
            console.error("Could not stop nginx:", ret.out);
            return ret;
        }

        clog("Stopped", "blue");
        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};

// returns null if it's successful otherwise returns string err
exports.reload = function(onlyIfNeeded, silent){

    if (onlyIfNeeded && !exports.needsReload)
        return null;

    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH || os_info.isSuse){

        if (!silent)
            clog("Reloading NGINX", "green");

        updateConfFile();

        var ret = jxcore.utils.cmdSync(nginx_process + " -s reload -p "+ nginx_dir);
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
    }
    else{
        if (!silent)
            console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
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