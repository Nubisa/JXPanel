var osInfo = null;
exports.OSInfo = function(){
    if(osInfo)
        return osInfo;

    var info = jxcore.utils.getOS().toLowerCase();

    osInfo = {};
    osInfo.fullName = info;

    osInfo.isUbuntu = /ubuntu/.test(info);
    if(!osInfo.isUbuntu){
        osInfo.isDebian = /debian/.test(info);
    }
    else
        osInfo.isDebian = false;

    osInfo.isMac = /mac/.test(info);
    osInfo.is64 = /x64/.test(info);
    osInfo.is32 = !osInfo.is6;
    osInfo.isRH = /red hat/.test(info);
    osInfo.isSuse = /suse/.test(info);
    osInfo.isBSD = /bsd/.test(info);

    if(osInfo.isUbuntu)
        osInfo.OS_STR = "ub";
    else if(osInfo.isDebian)
        osInfo.OS_STR = "dev";
    else if(osInfo.isMac)
        osInfo.OS_STR = "osx";
    else if(osInfo.isRH)
        osInfo.OS_STR = "rh";
    else if(osInfo.isSuse)
        osInfo.OS_STR = "suse";
    else if(osInfo.isSuse)
        osInfo.OS_STR = "bsd";
    else
        throw new Error("This operating system is not supported ("+info+")");

    osInfo.OS_STR += (osInfo.is64)? "64":"32";

    return osInfo;;
};