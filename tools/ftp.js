var path = require('path');
var fs = require('fs');

var loc = 2;
if(process.argv[2] == 'ftp.js')
    loc++;

if(!process.argv[loc]){
    console.error("jx ftp.js [panel name]");
    process.exit(-1);
}

var panel_name = process.argv[loc];

var tools_dir = path.join(__dirname, "../server_apps");
var ftp_dir = tools_dir + path.sep + "ftp";
var loc = path.join(__dirname, '/proftpd-1.3.5');

process.chdir(loc);

var RunIt = function(str){
var ret = jxcore.utils.cmdSync(str);
    if(ret.exitCode != 0){
        console.error("FTP Installation failed", str);
        console.error(ret.out);
        process.exit(ret.exitCode);
    }
};

var log = jxcore.utils.console.log;
var user_name = jxcore.utils.cmdSync('id -un').out.trim();
var user_group = jxcore.utils.cmdSync('id -gn').out.trim();
log("Installing FTP Server", "green");
RunIt('echo "./configure --prefix=' + ftp_dir + '" | sh');
log("[OK] Configure", "green");
RunIt("make install");
log("[OK] Compile", "green");
RunIt("make clean");
var conf_file = ftp_dir + path.sep + "etc" + path.sep  + "proftpd.conf";
var conf = fs.readFileSync(conf_file) + "";
conf = conf.replace("{{user.name}}", user_name);
conf = conf.replace("{{user.group}}", user_group);
conf = conf.replace("{{panel.name}}", panel_name);
conf = conf.replace("{{process.pidfile}}", path.join(ftp_dir, "etc/pid"));
fs.writeFileSync(conf_file, conf);
log("[OK] Settings", "green");
log("FTP server is successfully installed", "green");
RunIt(ftp_dir + path.sep + "sbin" + path.sep + "proftpd");





