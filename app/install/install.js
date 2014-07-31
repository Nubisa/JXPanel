var fs = require('fs');
var pathModule = require('path');
var os_info = require('./os_info').OSInfo();
var nginx = require('./nginx');
var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var app_folder = pathModule.join(__dirname, "../../server_apps"); // ignored from git
var tools_folder = pathModule.join(__dirname, "../../tools");
var sqlite2 = require("./sqlite2");

exports.apps_folder = app_folder;

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
    process.chdir(app_folder);
    ret = jxcore.utils.cmdSync(process.argv[0] + " " + app_folder + sep + "nginx.jx")
    if(ret.out.trim().indexOf("Done")<0 || ret.exitCode != 0){
        console.error("Couldn't install nginx jx package", app_folder + sep + "nginx.jx", ret.out);
        process.exit(-1);
    }
    fs.unlinkSync( app_folder + sep + "nginx.jx");

    nginx.prepare();
    var res = nginx.start();
    if(res){
        console.error(res.out);
        process.exit(res.exitCode);
    }
};

var installDB = function() {
    sqlite2.ReadDB(function(err) {

    });
};


var prepareUserGroup = function(){
    clog("Adding jxman user group", "green");
    if(!os_info.isMac){
        var ret_val = jxcore.utils.cmdSync("getent group jxman");

        if(ret_val.out.indexOf("jxman:")>=0){
            return true;
        }

        var cmd = "groupadd jxman";
        if(os_info.isRH){
            cmd = "/usr/sbin/groupadd jxman";
        }
        ret_val = jxcore.utils.cmdSync(cmd);
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

    var ret;
    // install lib_pam
    if(os_info.isRH){
        ret = jxcore.utils.cmdSync("sudo yum install -y pam-devel");
    }
    else if(os_info.isDebian || os_info.isUbuntu){
        ret = jcore.utils.cmdSync("sudo apt-get install -y libpam0g-dev");
    }
    else{
        console.error("find out lib pam installation for this server");
        process.exit(-1);
    }

    if(ret.exitCode !== 0){
        console.error(ret.out);
        process.exit(-1);
    }

    // create server_apps folder
    fs.mkdirSync(app_folder);
    ret = jxcore.utils.cmdSync("chmod -R o-rwx " + app_folder);

    installNGINX();
    installDB();
};

exports.uninstall = function(){
    if(fs.existsSync(app_folder))
    {
        clog("Uninstalling the previous installation", "red");
        var res = nginx.stop();
        if(res){
            console.error(res.out);
        }

        res = jxcore.utils.cmdSync("rm -rf "+app_folder);
        if(res.exitCode != 0){
            console.error(res.out);
            process.exit(res.exitCode);
            return;
        }
    }
};