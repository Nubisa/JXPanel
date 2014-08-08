var path = require('path');
var fs = require('fs');
var osinfo = require('../app/install/os_info').OSInfo();

var tools_dir = path.join(__dirname, "../server_apps");

var RunIt = function(str){
    var ret = jxcore.utils.cmdSync(str);
    if(ret.exitCode != 0){
        console.error("System Tools Installation failed", str);
        console.error(ret.out);
        process.exit(ret.exitCode);
    }
};

var log = jxcore.utils.console.log;

log("Installing Development Tools", "green");
log("This may take a while, please wait..");
if(osinfo.isRH){
    RunIt('yum groupinstall -y "Development Tools');
    RunIt("yum install -y gcc gcc-c++ make unzip pam-devel git");
}
else if(osinfo.isDebian || osinfo.isUbuntu){
    RunIt("apt-get install -y build-essential gcc g++ make unzip libpam0g-dev git");
}
else if(osinfo.isSuse){
    RunIt("zypper install -n -y -t pattern devel_basis");
    RunIt("zypper install -n -y -t pattern devel_C_C++");
    RunIt("zypper install -n -y pam-devel");
    RunIt("zypper install -n -y git");
}
else if(osinfo.isArch){
    RunIt("pacman -Sy base-devel");
    RunIt("pacman -Sy unzip");
    RunIt("pacman -Sy git");
    RunIt("pacman -Sy pam");
}