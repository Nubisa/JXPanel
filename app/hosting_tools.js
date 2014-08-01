/**
 * Created by root on 7/31/14.
 */

var database = require("./install/database");
var site_defaults = require("./definitions/site_defaults");
var os_info = require("./install/os_info");
var path = require("path");
var fs = require("fs");
var exec = require('child_process').exec;
var https = require("https");

// iterating through domains and assigning http/https port
exports.setPortRange = function (min, max) {

    var domains = database.getDomainsByUserName(null, 1e5);

    var current = min;
    for (var i in domains) {
        var domain = database.getDomain(domains[i]);
        var ok = current <= max - 2;
        domain.port_http = ok ? current++ : null;
        domain.port_https = ok ? current++ : null;
    }

    database.setConfigValue("jx_app_min_port", min);
    database.setConfigValue("jx_app_max_port", max);
    database.UpdateDB();
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

exports.appGetJXConfig = function (domain_name) {

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

    exports.appGetSpawnerCommand()

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err: "DomainNotFound" };

    var plan = database.getPlanByDomainName(domain_name);
    if (!plan)
        return { err: "PlanInvalid" };

    var json = {
        "monitor": {
            "https": {
                "httpsKeyLocation": site_defaults.dirMonitorCertificates + "server.key",
                "httpsCertLocation": site_defaults.dirMonitorCertificates + "server.crt"
            }
        }
    };
    var add = function (field_name, value) {
        if (!value && value !== false && value !== 0)
            return;

        json[field_name] = value;
    };

    for (var o in domain) {
        if (fields[o])
            add(fields[o], domain[o]);
    }

    for (var o in plan) {
        if (fields[o])
            add(fields[o], plan[o]);
    }

    for (var o in plan.planMaximums) {
        if (fields[o])
            add(fields[o], plan.planMaximums[o]);
    }

    // replacement for config file name
    //  app_location.replace(/[\/]/g, "_").replace(/[\\]/g, "_")

    //return { cfg : json, path : }
    console.log(json);
};

exports.appGetSpawnerPath = function (domain_name) {
    var dir = site_defaults.dirAppConfigs;
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir);

    var spawner_org = path.join(__dirname, "spawner/spawner.jx");
    var spawner = dir + "spawner_" + domain_name + ".jx";
    if (!fs.existsSync(spawner))
        jxcore.utils.cmdSync("cp " + spawner_org + " " + spawner);

    if (!fs.existsSync(spawner))
        return { err: "CannotCopySpawner" };

    return spawner;

};


exports.appGetSpawnerCommand = function (domain_name) {

    /*
     .../jx spawner_7.jx -opt '{ "user" : "krisuser", "log" : "/var/www/vhosts/krissubscription.com/httpdocs/jxcore_logs/index.txt", "file" : "/var/www/vhosts/krissubscription.com/httpdocs/index.js", "domain" : "krissubscription.com", "tcp" : "10008", "tcps" : "10009", "logWebAccess" : "0"}'

     */
    var ret = exports.appGetSpawnerPath(domain_name);
    if (ret.err)
        return ret;

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err: "DomainNotFound" };

    var user = database.getUser(domain.owner);
    if (!user)
        return { err: "UserUnknown" };

    var appDir = path.join(site_defaults.dirUserApps, user.name);
    if (!fs.existsSync(appDir))
        return { err : "" }

    var opt = {
        "user": user.name,
        "log": site_defaults.dirUserApps + "/jxcore_logs/index.txt",
        "file": appDir + path.sep + "index.js",
        "domain": domain.name,
        "tcp": domain.port_http,
        "tcps": domain.port_https,
        "logWebAccess": domain.jx_app_log_web_access
    };

    var jxPath = exports.getJXPath();
    if (jxPath.err)
        return jxPath;

    var cmd = jxPath + " " + ret + " -opt '" + JSON.stringify(opt) + "'";
    return cmd;
};

exports.appStartStop = function(startOrStop, domain_name, cb) {

    var spawnerCmd = exports.appGetSpawnerCommand(domain_name);
    if (spawnerCmd.err) {
        cb(spawnerCmd.err);
        return;
    }

    if (startOrStop) {
        var jxconfig = exports.appGetJXConfig(domain_name);
        if (jxconfig.err) {
            cb(jxconfig.err);
            return;
        }
        fs.writeFileSync()
    }

    var jxPath = exports.getJXPath();
    var spawner = exports.appGetSpawnerPath(domain_name);


    exports.getMonitorJSON(false, function(err, ret) {
        var online_before = !err && ret && ret.indexOf(spawner) !== -1;

        // no point to start a[[, if it's running
        if (startOrStop && online_before) {
            cb();
            return;
        }

        // no point to stop app if it's not running
        if (!startOrStop && !online_before) {
            cb();
            return;
        }

        var cmd = startOrStop ? spawnerCmd : jxPath + " monitor kill " + spawner + " 2>&1";
        exec(cmd, {cwd: path.dirname(jxPath), maxBuffer: 1e7}, function (err, stdout, stderr) {
            // cannot rely on err in this case. command returns non-zero exitCode on success
            exports.getMonitorJSON(false, function(err2, ret2) {
                var online_after = !err2 && ret2 && ret2.indexOf(spawner) !== -1;

                var err = online_after === online_before;
                var msg = null;
                if (err) {
                    msg = startOrStop ? "JXcoreAppCannotStart" : "JXcoreAppCannotStop";
                    msg += "|" + domain_name;
                    if (err2) msg += " " + err2;
                } else {
                    console.log(startOrStop ? "JXcoreAppStarted" : "JXcoreAppStopped", domain_name);
                }

                cb(msg);
            });
        });
    });
};

exports.appIsRunning = function (domain_name) {

};


exports.saveMonitorConfig = function (jxPath) {

    var dir = path.dirname(jxPath) + path.sep;
    var cfgPath = dir + "jx.config";

    var json = {
        "monitor": {
            "log_path": dir + "jx_monitor_[WEEKOFYEAR]_[YEAR].log",
            //"users": [ "psaadm" ],
            "https": {
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

    return { err: "JXcorePathInvalid" }
};


exports.getMonitorJSON = function (parse, cb) {
    if (!cb) {
        return;
    }

    var options = {
        hostname: 'localhost',
        port: 17777,
        path: '/json?silent=true',
        method: 'GET',
        rejectUnauthorized: false
    };

    https.get(options,function (res) {
        var body = "";

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function () {
            try {
                var json = parse ? body :JSON.parse(body);
                cb(false, json);
            } catch (ex) {
                cb("Cannot parse json: " + ex);
            }
        });
    }).on('error', function (e) {
        cb(e.toString())
    });
};


exports.monitorStartStop = function (startOrStop, cb) {

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

                cb(msg);
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

        exec(cmd, {cwd: path.dirname(jxPath), maxBuffer: 1e7}, function (err, stdout, stderr) {
            // cannot rely on err in this case. command returns non-zero exitCode on success
            checkAfter();
        });
    });


};