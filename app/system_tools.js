var fs = require('fs');
var path = require('path');
var http = require("http");
var https = require("https");
var database = require("./install/database");
var os_info = require("./install/os_info");
var exec = require('child_process').exec;
var hosting_tools = require("./hosting_tools");
var folder_utils = require('./definitions/user_folders');

var outputConvert = function(str, expects, fixer){
    var lines = str.split('\n');
    if(lines.length){
        var obj = {};
        var dict = {length:0};
        var n = 0;
        var apply_result = null;
        for(var i=0, ln=lines.length;i<ln;i++){
            var cols;
            if(!apply_result){
                lines[i] = lines[i].replace(/\\t/g, " ");

                if(n==0)
                    cols = lines[i].match(/[a-zA-Z0-9#%\/.:+_-]+/g);
                else
                    cols = lines[i].match(/[a-zA-Z0-9#%\/.:+_-]+[ ]?[a-zA-Z]*/g);

                if(!cols)
                    continue;

                if(cols.length<expects){
                    continue;
                }
            }
            else
            {
                cols = apply_result;
                apply_result = null;
            }

            var back = [];
            for(var o in cols){
                cols[o] = cols[o].trim();
                if(n==0){
                    obj[cols[o]] = [];
                    dict[o] = cols[o];
                    dict.length ++;
                }
                else{
                    if(!obj[dict[o]]){
                        back = [];
                        break;
                    }
                    back.push(cols[o]);
                }
            }
            if(back.length){
                for(var o in back){
                    obj[dict[o]].push(back[o]);
                }
            }
            else if(n>0 && fixer){
                var result = fixer(dict, cols);
                if(result){
                    i--;
                    apply_result = result;
                }
            }
            n++;
        }
        dict = null;
        return obj;
    }
    return {};
};

exports.IsOSX = /mac/.test(jxcore.utils.getOS());

var getTop = function(is_up){
    var num_cols = 12;
    var result;
     
    if(exports.IsOSX)
    	result = jxcore.utils.cmdSync("top -l 1 -ncols "+num_cols);
    else{
    	result = jxcore.utils.cmdSync("top -n 1 -b");
	result.out = result.out.replace(/[ ]/g, "  ");
    }

    if(result.exitCode != 0 || !result.out){
        return "UnableToRead";
    }

    var ln = result.out.indexOf("\n\n") + 2;
    if(is_up){
        return result.out.substr(0, ln - 4);
    }
    result.out = result.out.substr(ln, result.out.length-ln);

    var combiner = function(cols, expects){
        if(/[a-zA-Z]+/.test(cols[2])){
            var arr = [cols[0], cols[1] + " " + cols[2]];

            for(var o = 3, ln = cols.length; o<ln ;o++){
                arr.push(cols[o]);
            }
            if(arr.length>expects){
                return combiner(arr, expects);
            }
            return arr;
        }
        return cols;
    };

    var fixer = function(dict, cols){
        if(cols.length>num_cols){
            return combiner(cols, num_cols);
        }
    };

    return outputConvert(result.out, num_cols, is_mac?fixer:null);
};


var getdiskUsage = function(folder){
    var result = jxcore.utils.cmdSync("du -sh " + folder);

    if(result.exitCode != 0 || !result.out){
        return "UnableToRead";
    }

    result = result.out.split('\t');
    result = result[0].toLowerCase().trim();

    var size = result.substr(result.length-1, 1) + "";
    var total = parseFloat(result.substr(0, result.length-1));

    if(size == "g"){
        return total / 1024;
    }
    else if(size == "m"){
        return total;
    }
    else if(size == "k"){
        return total / (1024);
    }
    return total;
};


var getDiskInfo = function(){
    var num_cols = 0;
    var result = jxcore.utils.cmdSync("df -h");

    if(result.exitCode != 0 || !result.out){
        return "UnableToRead";
    }

    result.out = result.out.toLowerCase().replace("mounted on", "mounted_on");

    var ln = result.out.indexOf("\n\n");
    if(ln > 0){
        ln += 2;
        result.out = result.out.substr(ln, result.out.length-ln);
    }

    var combiner = function(cols, expects){
        if(/[a-zA-Z]+/.test(cols[1])){
            var arr = [cols[0] + " " + cols[1]];

            for(var o = 2, ln = cols.length; o<ln ;o++){
                arr.push(cols[o]);
            }
            if(arr.length>expects){
                return combiner(arr, expects);
            }
            return arr;
        }
        return cols;
    };

    var fixer = function(dict, cols){
        if(cols.length>dict.length){
            return combiner(cols, dict.length);
        }
    };

    return outputConvert(result.out, num_cols, fixer);
};

exports.getOSInfo = function(){
    var res = jxcore.utils.cmdSync("uname -msrn");
    if(res.exitCode != 0){
        return "UnableToRead";
    }

    return res.out;
};


//returns folder's disk usage in Gb
exports.getDiskUsageSync = getdiskUsage;
exports.getDiskUsage = function(folder, cb){
    var task = function(folder){
        var ts = require('./system_tools');
        return ts.getDiskUsageSync(folder);
    };

    jxcore.tasks.addTask(task, folder, cb);
};


// returns objected version of top results { PID: [ array of PIDs] , ...... }
exports.getTopSync = getTop;
exports.getTop = function(is_up, env, cb){
    var task = function(val){
        var ts = require('./system_tools');
        return {res:ts.getTopSync(val.b), e:val.e};
    };

    jxcore.tasks.addTask(task, {b:is_up, e:env}, cb);
};


// returns objected version of "df -h" results { Filesystem: [ array of ..] , ...... }
exports.getDiskInfoSync = getDiskInfo;
exports.getDiskInfo = function(env, cb){
    var task = function(env){
        var ts = require('./system_tools');
        return {res:ts.getDiskInfoSync(), e:env};
    };

    jxcore.tasks.addTask(task, env, cb);
};


/**
 * Removes folder recursively
 * @param fullDir
 * @returns {boolean} True, if operation succeeded. False otherwise.
 */
exports.rmdirSync = function (fullDir) {

    fullDir = path.normalize(fullDir);
    if (!fs.existsSync(fullDir)) {
        return;
    }

    var cmd = process.platform === 'win32' ? "rmdir /s /q " : "rm -rf ";
    jxcore.utils.cmdSync(cmd + fullDir);

    return !fs.existsSync(fullDir);
};


exports.systemUserExists = function(username) {
    var ret = jxcore.utils.cmdSync("id -g " + username);
    return !isNaN(parseInt(ret.out));
};

exports.getUserIDS = function(username){
    var ret = jxcore.utils.cmdSync("id -u " + username);
    try{
        ret.out = parseInt(ret.out);
    }
    catch(e){
        return null;
    }
    if(isNaN(ret.out)){return null;}

    var uid = ret.out;

    ret = jxcore.utils.cmdSync("id -g " + username);

    try{
        ret.out = parseInt(ret.out);
    }
    catch(e){
        return null;
    }

    if(isNaN(ret.out)){return null;}

    var gid = ret.out;

    return {uid:uid, gid:gid};
};

exports.addSystemUser = function(json, password, skip) {
    var username = json.name;
    if (!skip && exports.systemUserExists(username))
        return { err : "UserAlreadyExists"  };

    // sudo is not working when calling exec, so the current process must be running as root

    var ret = folder_utils.createUserHome(json.plan, json.name);

    if(ret.err){
        return ret;
    }

    var loc = ret.home;

    if(!skip){
        var cmd = "/usr/sbin/useradd -g jxman -d " + loc + " -M -s /sbin/nologin " + username;
        cmd += ';echo "' + username + ':' + password + '" | /usr/sbin/chpasswd -c SHA256';

        ret = jxcore.utils.cmdSync(cmd);
    }
    else
        ret.exitCode = 0;

    if (ret.exitCode){
        jxcore.utils.cmdSync("rm -rf "+loc);
        console.error("UsersCannotCreateSystemUser", ret.out.toString().trim());
    }else{
        var ids = exports.getUserIDS(username);
        if(ids){
            folder_utils.markFile(loc, ids.uid, ids.gid);
        }else{
            return {err: "CouldntFixFolderPermissions"};
        }
    }

    return { err : ret.exitCode ? "UsersCannotCreateSystemUser" : false };
};

exports.updatePassword = function(username, password) {
    var cmd = 'echo "' + username + ':' + password + '" | /usr/sbin/chpasswd -c SHA256';

    var ret = jxcore.utils.cmdSync(cmd);
    return { err : ret.exitCode ? "UsersCannotUpdatePassword" : false };
};


exports.deleteSystemUser = function(username, withHomeDir) {
    if (!exports.systemUserExists(username))
        return { err : false  };

    var cmd = '/usr/sbin/deluser ' + username;
    var ret = jxcore.utils.cmdSync(cmd);

    if (ret.exitCode) {
        console.error("UsersCannotDeleteSystemUser", ret.out.toString().trim());
        return { err : ret.exitCode ? "UsersCannotDeleteSystemUser" : false };
    } else {
        console.log("System user %s was deleted successfully.", username);
    }

    if (withHomeDir) {
        var plans = database.getPlansByUserName(username);
        if (!plans) {
            return { err : "DBCannotGetPlan" };
        }

        var dir = folder_utils.getUserPath(null, username);
        if (fs.existsSync(dir)) {
            exports.rmdirSync(dir);
            if (fs.existsSync(dir)) {
                return { ret : "UsersCannotDeleteSystemUsersFolder" };
            }
        }
    }

    return { err : false };
};


exports.downloadFile = function (url, localFile, cb) {
    if (!cb) {
        return;
    }

    var file = null;
    try {
        file = fs.createWriteStream(localFile);
    } catch (ex) {
        cb(ex.message);
        return;
    }

    https.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close();
            cb(false);
        });
        file.on("error", function (txt) {
            cb("JXcoreCannotDownload|" + txt);
        });
    });
};

// also reinstalls if already is installed
exports.installJX = function (cb) {

    var jxPath = hosting_tools.getJXPath();

    var _install = function () {

        // clearing the fodler first
        if (!jxPath.err && fs.existsSync(jxPath)) {
            exports.rmdirSync(path.dirname(jxPath));
        }

        var os_str = os_info.OSInfo().OS_STR;

        var dir = path.join(os_info.apps_folder, "jx_" + os_str) + path.sep;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        var basename = "jx_" + os_str;
        var zipFile = path.join(os_info.apps_folder, basename + ".zip");
        var url = "https://s3.amazonaws.com/nodejx/" + basename + ".zip";

        exports.downloadFile(url, zipFile, function (err) {
            if (err) {
                cb(err);
                return;
            }

            // unzipping
            exec("unzip -u " + zipFile, {cwd: os_info.apps_folder, maxBuffer: 1e7}, function (err, stdout, stderr) {
                if (err !== null) {
                    cb("Error" + JSON.stringify(err) + (stderr || stdout));
                } else {

                    var file = dir + "jx";

                    fs.unlinkSync(zipFile);

                    if (fs.existsSync(file)) {
                        var ret = jxcore.utils.cmdSync("'" + file + "' -jxv");
                        var jxv = ret.out.toString().trim();

                        // if current jx is different than downloaded, use it
                        if (jxv < process.jxversion) {
                            jxcore.utils.cmdSync("cp '" + process.execPath + "' '" + file + "'");
                            jxv = process.jxversion;
                        }

                        jxcore.utils.cmdSync("chmod 0775 " + dir + "; chmod 0755 " + file);

                        hosting_tools.saveMonitorConfig(file);

                        database.setConfigValue("jxPath", file);
                        database.setConfigValue("jxv", jxv, true);

                        // let's start the monitor after install
                        hosting_tools.monitorStartStop(true, function (err01) {
                            cb(err01 || false)
                        });
                    } else {
                        cb("FileDoesNotExist");
                    }
                }
            });
        });
    };


    if (jxPath.err) {
        // just install
        _install();
    } else {
        // shut the monitor down

        hosting_tools.monitorStartStop(false, function (err0) {

            if (err0) {
                cb(err0);
                return;
            }

            _install();
        });
    }
};


