var fs = require('fs');
var pathModule = require('path');
var os_info = require('./os_info').OSInfo();
var site_defaults = require("../definitions/site_defaults");

var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var nginx_dir = os_info.appsFolder + sep + "nginx";
var nginx_process =  nginx_dir + sep + "sbin" + sep + "nginx";

exports.needsReload = false;

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

// returns null if it's successfull otherwise returns ret{exitCode, out}
exports.start = function(){
    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH){
        clog("Starting NGINX", "green");
        var ret = jxcore.utils.cmdSync(nginx_process + " -p "+ nginx_dir);
        if(ret.exitCode !== 0)
            return ret;

        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};

// returns null if it's successfull otherwise returns ret{exitCode, out}
exports.stop = function(){
    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH){
        clog("Stopping NGINX", "green");

        var ret = jxcore.utils.cmdSync(nginx_process + " -s stop -p "+ nginx_dir);
        if(ret.exitCode !== 0)
            return ret;

        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};

// returns null if it's successfull otherwise returns ret{exitCode, out}
exports.reload = function(onlyIfNeeded){

    if (onlyIfNeeded && !exports.needsReload)
        return null;

    if(os_info.isDebian || os_info.isUbuntu || os_info.isRH){
        clog("Reloading NGINX", "green");

        updateConfFile();

        var ret = jxcore.utils.cmdSync(nginx_process + " -s reload -p "+ nginx_dir);
        if(ret.exitCode !== 0)
            return ret;

        exports.needsReload = false;

        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};