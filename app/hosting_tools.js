/**
 * Created by root on 7/31/14.
 */

var database = require("./install/database");
var site_defaults = require("./definitions/site_defaults");

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

exports.getPortRange = function() {
    var cfg = database.getConfig();
    var min = parseInt(cfg.jx_app_min_port);
    if (!min || isNaN(min)) min = site_defaults.defaultAppMinPort;
    var max = parseInt(cfg.jx_app_max_port);
    if (!max || isNaN(max)) max = site_defaults.defaultAppMaxPort;

    return { min : min, max : max, count : max - min}
};


exports.getTakenPorts = function() {
    var domains = database.getDomainsByUserName(null, 1e5);

    var ret = [];
    for(var o in domains) {
        var domain = database.getDomain(domains[o]);
        ret.push(domain.port_http);
        ret.push(domain.port_https);
    }
    return ret;
};

exports.getFreePorts = function(howMany) {

    if (!howMany) howMany = 2;

    var range = exports.getPortRange();
    var taken = exports.getTakenPorts();

    var ret = [];
    for(var a = range.min; a<= range.max; a++) {
        if (taken.indexOf(a) === -1) {
            ret.push(a);
            if (ret.length >= howMany)
                return ret;
        }
    }

    return null;
};

exports.getJXConfig = function(domain_name) {

    var fields = {
        // plan settings
        "plan_memory" : "maxMemory",
        "plan_cpu" : "maxCPU",
        "plan_cpu_interval" : "maxCPUInterval",
        "plan_custom_socket" : "allowCustomSocketPort",
        "plan_sys_exec" : "allowSysExec",
        "plan_local_native_modules" : "allowLocalNativeModules",

        // domain settings
        "port_http" : "portTCP",
        "port_https" : "portTCPS"
    };

    var domain = database.getDomain(domain_name);
    if (!domain)
        return { err : "DomainNotFound" };

    var plan = database.getPlanByDomainName(domain_name);
    if (!plan)
        return { err : "PlanInvalid" };

    var json = {};
    var add = function(field_name, value) {
        if (!value && value !== false && value !== 0)
            return;

        json[field_name] = value;
    }


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


    console.log(json);

};