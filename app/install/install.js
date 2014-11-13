var fs = require('fs');
var pathModule = require('path');
var os_info = jxcore.utils.OSInfo();
var nginx = require('./nginx');
var ftp = require('./ftp');
var sep = pathModule.sep;
var clog = jxcore.utils.console.log;
var app_folder = pathModule.join(__dirname, "../../server_apps"); // ignored from git
var tools_folder = pathModule.join(__dirname, "../../tools");
var sqlite2 = require("./sqlite2");
var hosting_tools = require("../hosting_tools");
var system_tools = require("../system_tools");

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


var installFTP = function() {

    var ftp_dir = pathModule.join(app_folder, "ftp")
    var loc = pathModule.join(tools_folder, 'proftpd-1.3.5');

    process.chdir(loc);

    var RunIt = function(str){
        var ret = jxcore.utils.cmdSync(str);
        if(ret.exitCode != 0){
            console.error("FTP Installation failed", str);
            console.error(ret.out);
            process.exit(ret.exitCode);
        }
    };

    var user_name = jxcore.utils.cmdSync('id -un').out.trim();
    var user_group = jxcore.utils.cmdSync('id -gn').out.trim();
    clog("Installing FTP Server", "green");
    RunIt('echo "./configure --prefix=' + ftp_dir + '" | sh');
    clog("[OK] Configure", "green");
    RunIt("make install");
    clog("[OK] Compile", "green");
    RunIt("make clean");

    var conf = fs.readFileSync(ftp.conf_file) + "";
    conf = conf.replace("{{user.name}}", user_name);
    conf = conf.replace("{{user.group}}", user_group);
    conf = conf.replace("{{panel.name}}", "JXPanel");
    conf = conf.replace("{{process.pidfile}}", pathModule.join(ftp_dir, "etc/pid"));
    fs.writeFileSync(ftp.conf_file, conf);
    clog("[OK] Settings", "green");
    clog("FTP server is successfully installed", "green");
    RunIt(ftp_dir + sep + "sbin" + sep + "proftpd");

    process.chdir(app_folder);

    // previous version - calling ftp.js
//    clog("Installing FTP Server", "green");
//    var cmd = '"' + process.execPath + '" ' + pathModule.join(tools_folder, "ftp.js") + " JXPanel";
//    var ret = jxcore.utils.cmdSync(cmd);
//    if(ret.exitCode != 0){
//        console.error("Errors while installing ftp server.", ret,out);
//        process.exit(-1);
//        return;
//    }
//
//    console.log(ret.out);
};


var prepareUserGroup = function(){
    clog("Adding jxman user group", "green");
    if(!os_info.isMac){
        var ret_val = jxcore.utils.cmdSync("getent group jxman");

        if(ret_val.out.indexOf("jxman:")>=0){
            return true;
        }

        var cmd = "/usr/sbin/groupadd jxman";

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
    //if(os_info.isRH){
    //    ret = jxcore.utils.cmdSync("sudo yum install -y pam-devel");
    //}
    //else if(os_info.isDebian || os_info.isUbuntu){
    //    ret = jxcore.utils.cmdSync("sudo apt-get install -y libpam0g-dev");
    //}
    //else{
    //    console.error("find out lib pam installation for this server");
    //    process.exit(-1);
    //}

    //if(ret.exitCode !== 0){
    //    console.error(ret.out);
    //    process.exit(-1);
    //}

    // create server_apps folder
    fs.mkdirSync(app_folder);
    // chris changed from o-rwx to o-rw+x
    ret = jxcore.utils.cmdSync("chmod -R o-rw+x " + app_folder);

    installNGINX();
    installFTP();
    installDB();

    clog("Installing JXcore", "green");
    system_tools.installJX(null, function(err) {
        if (err)
            console.error("Cannot install JXcore. You need to do after logging into JXPanel", err);
        else
            console.log("JXcore installed succesfully.");
    });
};

exports.uninstall = function(){
    if(fs.existsSync(app_folder))
    {
        clog("Uninstalling the previous installation", "red");
        var res = nginx.stop();
        if(res){
            console.error(res.out);
        }

        var res = ftp.stop();
        if (res.err)
            console.error(res.err);

        var removeFiles = function() {
            clog("Removing files", "red");
            res = jxcore.utils.cmdSync("rm -rf "+app_folder);
            if(res.exitCode != 0){
                console.error(res.out);
                process.exit(res.exitCode);
            }
        };

        var database = require("./database");
        database.ReadDB(function(err) {
            if (!err) {
                var jxPath = hosting_tools.getJXPath();
                if (!jxPath.err) {
                    clog("Stopping JXcore monitor", "red");

                    hosting_tools.monitorStartStop(null, false, function(err) {
                        removeFiles();
                    });
                    return;
                }
            }

            removeFiles();
        });
    }
};