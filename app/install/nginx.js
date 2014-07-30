var fs = require('fs');
var pathModule = require('path');
var os_info = require('./os_info').OSInfo();

var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var app_folder = pathModule.join(__dirname, ".."+sep+".."+sep+"server_apps"); // ignored from git
var nginx_process = app_folder + sep + "nginx" + sep + "sbin" + sep + "nginx";

exports.prepare = function(){
    clog("Preparing NGINX for the first time usage", "green");
    jxcore.utils.cmdSync("service nginx stop");

    var ret = jxcore.utils.cmdSync("chmod 755 "+nginx_process);
    if(ret.exitCode != 0){
        console.error(ret.out);
        process.exit(ret.exitCode)
    }
};

// returns null if it's successfull otherwise returns ret{exitCode, out}
exports.start = function(){
    if(os_info.isDebian || os_info.isUbuntu){
        clog("Starting NGINX", "green");
        var ret = jxcore.utils.cmdSync(nginx_process + " -p "+ app_folder + sep + "nginx");
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
    if(os_info.isDebian || os_info.isUbuntu){
        clog("Stopping NGINX", "green");

        var ret = jxcore.utils.cmdSync(nginx_process + " -s stop -p "+ app_folder + sep + "nginx");
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
exports.reload = function(){
    if(os_info.isDebian || os_info.isUbuntu){
        clog("Reloading NGINX", "green");

        var ret = jxcore.utils.cmdSync(nginx_process + " -s reload -p "+ app_folder + sep + "nginx");
        if(ret.exitCode !== 0)
            return ret;

        return null;
    }
    else{
        console.error("Not Supported", os_info.fullName);
        process.exit(-1);
    }
};