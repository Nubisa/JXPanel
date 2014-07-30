var fs = require('fs');
var pathModule = require('path');
var os_info = require('./os_info').OSInfo();

var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var app_folder = pathModule.join(__dirname, "../../server_apps"); // ignored from git
var tools_folder = pathModule.join(__dirname, "../../tools"); // ignored from git

exports.requireInstallation = function(){
    var app_folder = pathModule.join(__dirname, "../../server_apps"); // ignored from git
    return !fs.existsSync(app_folder);
};

var installNGINX = function(){
    var ng_pack = tools_folder + sep + "nginx" + sep + os_info.OS_STR + "_nginx.jx ";
    clog("Installing NGINX", "green");
    var ret = jxcore.utils.cmdSync("cp " + ng_pack + app_folder + sep + "nginx.jx" );
    if(ret.exitCode != 0){
        console.error("Couldn't locate nginx jx package", ng_pack);
        process.exit(-1);
    }
    ret = jxcore.utils.cmdSync(process.argv[0] + " " + app_folder + sep + "nginx.jx")
    if(ret.out.trim() != "Done"){
        console.error("Couldn't install nginx jx package", app_folder + sep + "nginx.jx", ret);
        process.exit(-1);
    }
    fs.unlinkSync(process.argv[0] + " " + app_folder + sep + "nginx.jx");

//    console.log("Starting NGINX");
//    var ng = process.cwd()+"/nginx/sbin/nginx";
//    jxcore.utils.cmdSync("chmod 755 "+ng);
//    jxcore.utils.cmdSync("service nginx stop");
//    console.log(jxcore.utils.cmdSync("sudo "+ng+" -p "+process.cwd() + "/nginx"));
};

var prepareUserGroup = function(){
    clog("Adding jxman user group", "green");
    if(!os_info.isMac){
        var ret_val = jxcore.utils.cmdSync("getent group jxman");

        if(ret_val.out.indexOf("jxman:")>=0){
            return true;
        }

        ret_val = jxcore.utils.cmdSync("addgroup jxman");
        if(ret_val.exitCode !== 0){
            console.error(ret_val.out);
            clog("Consider starting this application with 'sudo' / admin rights.", "green");
            process.exit(ret_val.exitCode);
            return false;
        }

        return true;
    }
    return false;
};

exports.install = function(){
    clog("Operating System Detected :  "+ os_info.fullName);

    if(!prepareUserGroup()){
        return false;
    }

    // create server_apps folder
    fs.mkdirSync(app_folder);

    installNGINX();
};