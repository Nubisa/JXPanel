/**
 * Created by root on 11/28/14.
 */


var form_lang = require('./definitions/form_lang');
var path = require("path");
var database = require("./install/database");
var util = require("util");

var os = require('os');
var ifcs = os.networkInterfaces();

var ifcv4_list = [];
var ifcv6_list = [];

var resetInterfaces = function () {
    ifcv4_list = [];
    for (var i in ifcs) {
        var arr = ifcs[i];
        for (var o in arr) {
            if (arr[o]) {
                if (arr[o].family === "IPv4" && !arr[o].internal)
                    ifcv4_list.push(arr[o].address);

                if (arr[o].family === "IPv6" && !arr[o].internal) {
                    var ret = jxcore.utils.cmdSync('ifconfig ' + i + ' | grep "' + arr[o].address + '"');
                    if (!ret.exitCode && ret.out.toString().indexOf("Scope:Global") !== -1)
                        ifcv6_list.push(arr[o].address);
                }
            }
        }
    }
}();


// v6 = true / false / "both"
var _concat = function(ipv4, ipv6, v6) {

    var arr = [];
    if (v6 || v6 == "both") arr = arr.concat(JSON.parse(JSON.stringify(ipv6)));
    if (!v6 || v6 == "both") arr = arr.concat(JSON.parse(JSON.stringify(ipv4)));

    return arr;
};


// v6 = true / false / "both"
exports.getUserIPs = function(active_user, v6) {

    var plan = database.getPlan(active_user.plan);
    return exports.getPlanIPs(plan, v6);
};

// v6 = true / false / "both"
exports.getUserIPsAsHTML = function(active_user, v6) {

    var arr = exports.getUserIPs(active_user, v6);

    var t1 = '<span class="label label-default">';
    var t2 = '</span> ';
    return t1 + arr.join( t2 + t1) + t2;
};

// v6 = true / false / "both"
exports.getPlanIPs = function(plan, v6) {

    if (!plan)
        return { err : "PlanInvalid" };

    if (plan.name === database.unlimitedPlanName)
        return _concat(ifcv4_list, ifcv6_list, v6);

    var pool = v6 ? plan.plan_ipv6_pool : plan.plan_ipv4_pool;

    if (!pool)
        return { err : v6 ? "PlanParentNoIPv6Pool" : "PlanParentNoIPv4Pool" };

    var ipv4 = [];
    var ipv6 = [];

    // copies only existing addresses
    for(var o in pool) {
        if (v6 && ifcv6_list.indexOf(pool[o]) !== -1) ipv6.push(pool[o]);
        if (!v6 && ifcv4_list.indexOf(pool[o]) !== -1) ipv4.push(pool[o]);
    }

    return _concat(ipv4, ipv6, v6);
};


exports.getDomainIPs = function(domain, v6) {

    if (!domain)
        return { err : "DomainNotFound" };

    var plan = database.getPlanByDomainName(domain.name);
    var ips = exports.getPlanIPs(plan, v6);
    if (ips.err)
        return ips;

    if (v6 && ips.indexOf(domain.sub_ipv6) === -1)
        return { err : "IPDoesNotExists|" + domain.sub_ipv6 };

    if (!v6 && ips.indexOf(domain.sub_ipv4) === -1)
        return { err : "IPDoesNotExists|" + domain.sub_ipv4 };

    return _concat([domain.sub_ipv4], [ domain.sub_ipv6], v6);
};


// v6 = true / false / "both"
exports.getAllIPs = function(v6) {

    return _concat(ifcv4_list, ifcv6_list, v6);
};