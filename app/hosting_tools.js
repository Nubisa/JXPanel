/**
 * Created by root on 7/31/14.
 */

var database = require("./install/database");


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