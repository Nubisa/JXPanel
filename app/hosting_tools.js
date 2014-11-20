/**
 * Created by root on 7/31/14.
 */

var database = require("./install/database");
var site_defaults = require("./definitions/site_defaults");
var form_lang = require("./definitions/form_lang");
var _active_user = require("./definitions/active_user");
var path = require("path");
var fs = require("fs");
var exec = require('child_process').exec;
var http = require("http");
var https = require("https");
var user_folders = require("./definitions/user_folders");
var system_tools = require("./system_tools");
var nginxconf = require("./spawner/nginxconf");
var nginx = require("./install/nginx");
var apps_tools = require("./rendering/apps_tools");

// iterating through domains and assigning http/https port
exports.setPortRange = function (min, max) {

    var domains = database.getDomainsByUserName(null, 1e5);

    var changed = false;

    var current = min;
    for (var i in domains) {
        var domain = database.getDomain(domains[i]);
        var ok = current <= max - 2;
        var prev_http = domain.port_http;
        var prev_https = domain.port_https;
        domain.port_http = ok ? current++ : null;
        domain.port_https = ok ? current++ : null;

        if (prev_http !== domain.port_http || prev_https !== domain.port_https)
            changed = true;
    }

    database.setConfigValue("jx_app_min_port", min);
    database.setConfigValue("jx_app_max_port", max);
    database.updateDBFile();

    return changed;
};

exports.getPortRange = function () {
    var cfg = database.getConfig();
    var min = parseInt(cfg.jx_app_min_port);
    if (!min || isNaN(min)) min = site_defaults.defaultAppMinPort;
    var max = parseInt(cfg.jx_app_max_port);
    if (!max || isNaN(max)) max = site_defaults.defaultAppMaxPort;

    return { min: min, max: max, count: max - min}
};


exports.getTakenPorts = function () {
    var domains = database.getDomainsByUserName(null, 1e5);

    var ret = [];
    for (var o in domains) {
        var domain = database.getDomain(domains[o]);
        ret.push(domain.port_http);
        ret.push(domain.port_https);
    }
    return ret;
};

exports.getFreePorts = function (howMany) {

    if (!howMany) howMany = 2;

    var range = exports.getPortRange();
    var taken = exports.getTakenPorts();

    var ret = [];
    for (var a = range.min; a <= range.max; a++) {
        if (taken.indexOf(a) === -1) {
            ret.push(a);
            if (ret.length >= howMany)
                return ret;
        }
    }

    return null;
};


exports.appGetHomeDirByPlanAndUser = function(plan_name, user_name, domain_name) {

    return appDir = path.join(user_folders.getUserPath(plan_name, user_name), domain_name) + path.sep;
};


exports.appGetSSLInfo = function(app_dir, ssl_enabled, ssl_crt, ssl_key) {

    if (!ssl_enabled)
        return null;

    return { key : path.join(app_dir, ssl_key), crt : path.join(app_dir, ssl_crt) };
};

exports.appGetOptions = function (domain_name, domain_data) {

    var fields = {
        // plan settings
        "plan_memory": "maxMemory",
        "plan_cpu": "maxCPU",
        "plan_cpu_interval": "maxCPUInterval",
        "plan_custom_socket": "allowCustomSocketPort",
        "plan_sys_exec": "allowSysExec",
        "plan_local_native_modules": "allowLocalNativeModules",

        // domain settings
        "port_http": "portTCP",
        "port_https": "portTCPS"
    };

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err: "DomainNotFound" };

    var user = database.getUser(domain.owner);
    if (!user)
        return { err: "UserUnknown" };

    var plan = database.getPlan(user.plan);
    if (!plan)
        return { err: "PlanInvalid" };

    var json = { monitor : {} };
    if (isMonitorSecured()) {
        json.monitor.https = {
            "httpsKeyLocation": site_defaults.dirMonitorCertificates + "server.key",
            "httpsCertLocation": site_defaults.dirMonitorCertificates + "server.crt"
        };
    }

    var add = function (field_name, value, isBool) {
        if (!value && isBool)
            value = false;

        if (!value && value !== false && value !== 0)
            return;

        if (!isBool && value === database.defaultMaximum)
            return;

        json[field_name] = value;
    };

    for (var o in domain) {
        if (fields[o])
            add(fields[o], domain[o]);
    }

    for (var o in plan) {
        if (fields[o] && fields[o].slice(0,5) === "allow")
            add(fields[o], plan.GetBool(o), true);
    }

    for (var o in plan.planMaximums) {
        if (fields[o])
            add(fields[o], plan.GetMaximum(o));
    }

    json["allowMonitoringAPI"] = !!database.getConfigValue("jx_monitor_api");

    var appDir = path.join(user_folders.getUserPath(user.plan, domain.owner), domain_name) + path.sep;

    var appPath = path.join(appDir, domain.jx_app_path);

    var app3rdparty = domain.jx_app_type === 'custom' ? false : domain.jx_app_type;
    if (app3rdparty) {
        var appData = apps_tools.getData(domain_name, domain.jx_app_type);
        if (appData.err)
            return { err : appData.err };

        appPath = appData.path;
    }

    var appPathReplaced = appPath.replace(/[\/]/g, "_").replace(/[\\]/g, "_");
    var cfgPath = site_defaults.dirAppConfigs + appPathReplaced + ".jxcore.config";
    var logPath = path.join(appDir, "jxcore_logs/index.txt");

    var ssl_info = exports.appGetSSLInfo(appDir, domain.ssl, domain.ssl_crt, domain.ssl_key );

    return { cfg : json, cfg_path : cfgPath, app_dir : appDir, app_path : appPath, app_path_replaced : appPathReplaced, log_path : logPath, user : user, plan: plan, domain : domain, ssl_info : ssl_info };
};

exports.appCreateHomeDir = function(domain_name) {

    // creating dir for a domain
    var options = exports.appGetOptions(domain_name);
    if (options.err)
        return options;

    // no error
    if (fs.existsSync(options.app_dir))
        return false;

    var ret = user_folders.createUserFolder(options.app_dir);
    if (ret.err)
        return ret;

    var uids = system_tools.getUserIDS(options.user.name)
    ret = user_folders.markFile(options.app_dir, uids.uid, uids.gid);
    if (ret)
        return ret;

    return false;
};

exports.appGetNginxConfigPath = function(domain_name) {

    return site_defaults.dirNginxConfigs + domain_name + ".conf";
};

exports.appSaveNginxConfigPath = function(domain_name, reloadIfNeeded) {

    var dir = site_defaults.dirNginxConfigs;
    if (!fs.existsSync(dir)) {
        try {
            fs.mkdirSync(dir);
        } catch (ex) {};
        if (!fs.existsSync(dir))
            return {err : "NginxConfDirCannotCreate" };
    }

    var cfgPath = exports.appGetNginxConfigPath(domain_name);
    if (cfgPath.err)
        return cfgPath;

    var options = exports.appGetOptions(domain_name);
    var domain = options.domain;

    var plan = options.plan;

    var cfg = nginxconf.createConfig(domain_name, [ domain.port_http, domain.port_https ], domain.jx_web_log ? options.log_path : null,
        plan.plan_nginx_directives, options.ssl_info);

    var current = "";
    if (fs.existsSync(cfgPath)) {
        current = fs.readFileSync(cfgPath).toString();
    }

    if (current !== cfg) {
        fs.writeFileSync(cfgPath, cfg);
        nginx.needsReload = true;
    }

    if (reloadIfNeeded) {
        var res = nginx.reload(true);
        if (res)
            return { err : res };
    }

    return false;
};


exports.appRemoveNginxConfigPath = function(domain_name, reloadIfNeeded) {

    var cfgPath = exports.appGetNginxConfigPath(domain_name);
    if (cfgPath.err)
        return cfgPath;

    if (fs.existsSync(cfgPath)) {
        fs.unlinkSync(cfgPath);
        nginx.needsReload = true;

        if (reloadIfNeeded) {
            var res = nginx.reload(true);
            if (res)
                return { err : res };
        }
    }

    return false;
};


exports.appGetSpawnerPath = function (domain_name) {
    var dir = site_defaults.dirAppConfigs;
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    var spawner_org = path.join(__dirname, "spawner/spawner.jx");
    var spawner = dir + "spawner_" + domain_name + ".jx";
   // if (!fs.existsSync(spawner))
        jxcore.utils.cmdSync("cp " + spawner_org + " " + spawner);

    if (!fs.existsSync(spawner))
        return { err: "CannotCopySpawner" };

    return spawner;
};


exports.appGetSpawnerCommand = function (domain_name) {

    /*
     .../jx spawner_7.jx -opt '{ "user" : "krisuser", "log" : "/var/www/vhosts/krissubscription.com/httpdocs/jxcore_logs/index.txt", "file" : "/var/www/vhosts/krissubscription.com/httpdocs/index.js", "domain" : "krissubscription.com", "tcp" : "10008", "tcps" : "10009", "logWebAccess" : "0"}'

     */

    var jxPath = exports.getJXPath();
    if (jxPath.err)
        return jxPath;

    var spawnerPath = exports.appGetSpawnerPath(domain_name);
    if (spawnerPath.err)
        return spawnerPath;

    var options = exports.appGetOptions(domain_name);
    if (options.err)
        return options;

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err: "DomainNotFound" };

    var user = database.getUser(domain.owner);
    if (!user)
        return { err: "UserUnknown" };

    if (!fs.existsSync(options.app_dir)) {
        var ret = exports.appCreateHomeDir(domain_name);
        if (ret.err)
            return ret;
    }

    var opt = {
        "user": user.name,
        "log": options.log_path,
        "file": options.app_path,
        "domain": domain.name,
        "tcp": domain.port_http,
        "tcps": domain.port_https,
        "logWebAccess": domain.jx_web_log,
        "dontSaveNginxConfigFile" : true
    };

    var cmd = jxPath + " " + spawnerPath + " -opt '" + JSON.stringify(opt) + "'";
    return cmd;
};


exports.appRestart = function(active_user, domain_name, cb) {

    active_user.session.status = form_lang.Get(active_user.lang, "JXcoreAppStarting", true);
    exports.appStartStop(false, domain_name, function(err, _domain_name, _was_online) {
        if (err) {
            if (cb) cb(err);
            return;
        }

        if (_was_online) {
            exports.appStartStop(true, domain_name, cb);
        } else {
            cb();
        }
    });
};

// start or stop single app
exports.appStartStop = function(startOrStop, domain_name, cb) {

    var cmd = startOrStop ? appGetStartCommand(domain_name) : exports.appGetStopCommand(domain_name);
    if (cmd.err) {
        cb(cmd.err, domain_name, false);
        return;
    }

    exports.getMonitorJSON(false, function(err, ret) {
        var online_before = !err && ret && ret.indexOf(cmd.spawner) !== -1;

        // no point to start app, if it's running
        if (startOrStop && online_before) {
            cb(false, domain_name, online_before);
            return;
        }

        // no point to stop app if it's not running
        if (!startOrStop && !online_before) {
            cb(false, domain_name, online_before);
            return;
        }

        if (err || !ret) {
            // monitor is offline, don't treat this a error
            cb(false, domain_name, online_before);
            return;
        }

        exec(cmd.cmd, {cwd: path.dirname(cmd.jxPath), maxBuffer: 1e7}, function (errExec, stdout, stderr) {
            // cannot rely on err in this case. command returns non-zero exitCode on success

            // let's wait for monitor to respawn an app as user
            setTimeout(function() {
                exports.getMonitorJSON(false, function(err2, ret2) {
                    var online_after = !err2 && ret2 && ret2.indexOf(cmd.spawner) !== -1;

                    var err = online_after === online_before;
                    var msg = null;
                    if (err) {
                        msg = startOrStop ? "JXcoreAppCannotStart" : "JXcoreAppCannotStop";
                        msg += "|" + domain_name + " (" + errExec + ")";
                        if (err2) msg += " " + err2;
                    } else {
                        console.log(startOrStop ? "JXcoreAppStarted" : "JXcoreAppStopped", domain_name);
                        if (!startOrStop)
                            exports.appRemoveNginxConfigPath(domain_name);
                    }

                    if (!msg) {
                        var res = nginx.reload(true);
                        if (res)
                            msg = res;
                    } else {
                        var s = form_lang.Get('EN', msg, true);
                        console.error(s, errExec, stdout, stderr);
                    }


                    cb(msg, domain_name, online_before);
                });
            }, startOrStop ? 4000 : 10);
        });
    });
};


var appGetStartCommand = function(domain_name) {

    var spawnerCmd = exports.appGetSpawnerCommand(domain_name);
    if (spawnerCmd.err)
        return spawnerCmd;

    var options = exports.appGetOptions(domain_name);
    if (options.err)
        return options;

    var spawner = exports.appGetSpawnerPath(domain_name);
    if (spawner.err)
        return spawner;

    if (options.plan.suspended)
        return { err : "PlanSuspended" };

    var jxPath = exports.getJXPath();
    if (jxPath.err)
        return jxPath;

    fs.writeFileSync(options.cfg_path, JSON.stringify(options.cfg, null, 9));

    exports.appSaveNginxConfigPath(domain_name);

    return { cmd : spawnerCmd, jxPath : jxPath, options : options , spawner : spawner};
};


exports.appGetStopCommand = function(domain_name) {

    var spawner = exports.appGetSpawnerPath(domain_name);
    if (spawner.err)
        return spawner;

    var jxPath = exports.getJXPath();
    if (jxPath.err)
        return jxPath;

    return { cmd : jxPath + " monitor kill " + spawner + " 2>&1", spawner : spawner, jxPath : jxPath };
};


exports.appStopMultiple = function (domain_names, cb) {

    if (!domain_names || !domain_names.length) {
        // no domains, don't treat it as error
        if (cb) cb();
        return;
    }

    var infos = {};

    exports.getMonitorJSON(false, function (err, ret) {

        if (err || !ret) {
            // monitor is offline, don't treat this a error
            if (cb) cb();
            return;
        }

        var commands = [];

        for (var o in domain_names) {
            var domain_name = domain_names[o];
            infos[domain_name] = {};

            var cmd = exports.appGetStopCommand(domain_name);
            if (cmd.err) {
                infos[domain_name].err = spawner.err;
                continue;
            }

            var online_before = ret.indexOf(cmd.spawner) !== -1;

            // no point to stop app if it's not running
            if (!online_before) {
                stepDone();
                continue;
            }

            commands.push(cmd.cmd);
        }

        exports.runMultipleComands(commands, function () {
            exports.getMonitorJSON(false, function (err2, ret2) {

                var isErr = false;
                for (var o in domain_names) {
                    var domain_name = domain_names[o];
                    if (infos[domain_name].err) {
                        isErr = true;
                        continue;
                    }

                    var online_after = ret2.indexOf(infos[domain_name]) !== -1;

                    if (online_after) {
                        infos[domain_name].err = "JXcoreAppCannotStop";
                        isErr = true;
                    } else {
                        exports.appRemoveNginxConfigPath(domain_name, false);
                    }
                }
                if (cb) cb(isErr, isErr ? infos : false);
            });
        });
    });
};


// kills processes and allows the monitor to restart them
exports.appRestartMultiple = function (domain_names, cb) {

    if (!domain_names || !domain_names.length) {
        // no domains, don't treat it as error
        if (cb)  cb();
        return;
    }

    exports.getMonitorJSON(true, function (err, ret) {
        if (err) {
            // monitor offline. don't treat is as error
            if (cb) cb();
            return;
        }

        if (!ret || !ret.length) {
            // no monitored apps, don't treat this as error
            if (cb) cb();
            return;
        }

        var spawners = [];
        for (var o in domain_names) {
            var domain_name = domain_names[o];
            var spawner = exports.appGetSpawnerPath(domain_name);
            if (spawner.err)
                continue;

            // refreshes config files
            var cmd = appGetStartCommand(domain_name);
            if (cmd.err)
                continue;

            spawners.push(spawner);
        }

        if (!spawners.length) {
            if (cb) cb();
            return;
        }

        var killed = [];
        var notKilled = [];
        for (var o in ret) {
            var pid = ret[o].pid;
            var _path = ret[o].path;
            if (spawners.indexOf(_path) !== -1) {
                try {
                    process.kill(pid);
                    killed.push(pid);
                } catch (ex) {
                    notKilled.push(pid);
                }
            }
        }

//        console.log("killed", killed, "notkilled", notKilled);
        nginx.reload(true);
        cb(notKilled.length ? "Cannot kill: " + notKilled.join(", ") : false);
    });

};

exports.runMultipleComands = function (command_arr, cb) {

    if (!cb) {
        throw "Callback is required";
    }

    if (!command_arr || !command_arr.length) {
        // no domains, don't treat it as error
        cb();
        return;
    }

    var jxPath = exports.getJXPath();
    if (jxPath.err) {
        cb(jxPath.err);
        return;
    }

    var cnt = command_arr.length;
    var done = 0;

    var stepDone = function () {
        done++;
        if (done === cnt)
            cb();
    };

    for (var o in command_arr) {
        exec(command_arr[o], {cwd: path.dirname(jxPath), maxBuffer: 1e7}, function (err, stdout, stderr) {
            stepDone();
        });
    }
};


exports.saveMonitorConfig = function (jxPath) {

    var dir = path.dirname(jxPath) + path.sep;
    var cfgPath = dir + "jx.config";

    var json = {
        "monitor": {
            "log_path": dir + "jx_monitor_[WEEKOFYEAR]_[YEAR].log",
            //"users": [ "psaadm" ],
            // temporarily disabled SLL for monitor
            "https1": {
                "httpsKeyLocation": site_defaults.dirMonitorCertificates + "server.key",
                "httpsCertLocation": site_defaults.dirMonitorCertificates + "server.crt"
            }
        },
        "globalModulePath": site_defaults.dirNativeModules,
        "globalApplicationConfigPath": site_defaults.dirAppConfigs,
        "npmjxPath": dir
    };

    fs.writeFileSync(cfgPath, JSON.stringify(json, null, 4));
};

// returns path to jx executable for running user apps
exports.getJXPath = function () {

    var cfg = database.getConfig();

    if (cfg.jxPath && fs.existsSync(cfg.jxPath))
        return cfg.jxPath;

    return { err: "JXcoreNotInstalled" }
};

var _isMonitorSecured = null;

var isMonitorSecured = function() {

    if (_isMonitorSecured !== null)
        return _isMonitorSecured;

    var jxpath = exports.getJXPath();
    if (jxpath.err) {
        // default
        _isMonitorSecured = true;
        return _isMonitorSecured;
    }

    var cfg_file = path.join(jxpath, "jx.config");
    if (!fs.existsSync(cfg_file)) {
        _isMonitorSecured = false;
        return _isMonitorSecured;
    }

    try {
        var str = fs.readFileSync(cfg_file).toString();
        var json = JSON.parse(str);
        _isMonitorSecured = json && json.monitor && json.monitor.https ? true : false;
    } catch(ex) {
        _isMonitorSecured = false;
    }

    return _isMonitorSecured;
};

exports.getMonitorJSON = function (parse, cb) {
    if (!cb) {
        return;
    }

    var module = isMonitorSecured() ? https : http;

    var options = {
        hostname: 'localhost',
        port: 17777,
        path: '/json?silent=true',
        method: 'GET',
        rejectUnauthorized: false
    };

    module.get(options,function (res) {
        var body = "";

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            try {
                var json = parse ? JSON.parse(body) : body;
                cb(false, json);
            } catch (ex) {
                cb("Cannot parse json: " + ex);
            }
        });
    }).on('error', function (e) {
        cb(e.toString())
    });
};

// starts all not-suspended and not-disabled user apps
var appStartEnabledApplications = function(cb) {

    var commands = [];

    var unlimited = database.getPlan(database.unlimitedPlanName);
    if (!unlimited) {
        // no plan yet
        cb(false);
        return;
    }

    nginx.removeAllConfigs();
    var domains = database.getDomainsByPlanName(database.unlimitedPlanName, 1e7);
    for(var o in domains) {
        var domain_name = domains[o];
        var domain = database.getDomain(domain_name);
        var plan = database.getPlanByDomainName(domain_name);
        if (domain.jx_enabled && !plan.suspended) {
            var cmd = appGetStartCommand(domain_name);
            if (!cmd.err)
                commands.push(cmd.cmd);
        }
    }
    exports.runMultipleComands(commands, function() {
        var res = nginx.reload(true);
        cb(res ? res : false)
    });
};

exports.monitorStartStop = function (active_user, startOrStop, cb) {

    var jxPath = exports.getJXPath();
    if (jxPath.err) {
        cb(jxPath.err);
        return
    }

    exports.getMonitorJSON(false, function(err, ret) {
        var online_before = !err && ret;

        // no point to start monitor, if it's running
        if (startOrStop && online_before) {
            cb();
            return;
        }

        // no point to stop monitor if it's not running
        if (!startOrStop && !online_before) {
            cb();
            return;
        }

        var checkAfter = function () {
            exports.getMonitorJSON(false, function(err2, ret2) {
                var online_after = !err2 && ret2;

                var err = online_after === online_before;
                var msg = null;
                if (err) {
                    msg = startOrStop ? "JXcoreMonitorCannotStart" : "JXcoreMonitorCannotStop";
                    if (err2) msg += " " + err2;
                } else {
                    console.log(startOrStop ? "JXcoreMonitorStarted" : "JXcoreMonitorStopped");
                }

                if (startOrStop) {
                    if (active_user)
                        active_user.session.status = form_lang.Get(active_user.lang, "JXcoreAppsStarting", true);

                    appStartEnabledApplications(function() {
                        cb(msg);

                        if (active_user)
                            active_user.session.status = "";
                    });
                } else {
                    cb(msg);
                }

            });
        };

        // solution below crashes app, when EADDRINUSE
        // since it cannot be caught, i don't use it
//        var method = online_before ? jxcore.monitor.stopMonitor : jxcore.monitor.startMonitor;
//        try {
//            method(checkAfter);
//        } catch (ex) {
//            server.sendCallBack(env, {err : ex.toString() } );
//        }

        var cmd = "./jx monitor " + (startOrStop ? "start" : "stop");

        if (active_user)
            active_user.session.status = form_lang.Get(active_user.lang, startOrStop ? "JXcoreMonitorStarting" : "JXcoreMonitorStopping", true);

        exec(cmd, {cwd: path.dirname(jxPath), maxBuffer: 1e7}, function (err, stdout, stderr) {

            if (active_user)
                active_user.session.status = null;
            // cannot rely on err in this case. command returns non-zero exitCode on success
            checkAfter();
        });
    });
};


exports.monitorRestart = function(active_user, cb) {

    exports.monitorStartStop(active_user, false, function(err) {
        if (err) {
            if (cb) cb(err);
            return;
        }

        exports.monitorStartStop(active_user, true, cb);
    });
};


database.OnSuspend = function(name, field_name, table, suspended) {

//    console.error("suspended?", suspended, table, name, field_name);
    if (suspended) {


        var domains = [];
        if (table === "Plan") {
            domains = database.getDomainsByPlanName(name);
        }
        if (table === "User") {
            domains = database.getDomainsByUserName(name);
        }

//        database.updateDBFile();

        if (domains.length) {
            exports.appStopMultiple(domains, function(err) {
                if (err)
                    console.error("There were some errors while trying to stop applications.", err);
            });
        }
    }

};


exports.appGetConfigAsString = function(active_user) {

    var domain_name = _active_user.isRecordUpdating(active_user, "addDomain");
    if (!domain_name)
        return "";

    var options = exports.appGetOptions(domain_name);
    if (options.err)
        return form_lang.Get(active_user.lang, options.err);

    // no need to display this to user
    delete options.cfg.monitor;

    return JSON.stringify(options.cfg, null, "#nbsp#").replace(/\n/g, "<br>").replace(/#nbsp#/g, '<span style="margin-left: 20px;"></span>');
};