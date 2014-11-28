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
                if (arr[o].family === "IPv4")
                    ifcv4_list.push(arr[o].address);

                if (arr[o].family === "IPv6")
                    ifcv6_list.push(arr[o].address);
            }
        }
    }
}();

exports.getPlanIPs = function(active_user, v6, asArray) {

    var format = function(arr) {

        if (asArray)
            return arr;

        var t1 = '<span class="label label-default">';
        var t2 = '</span> ';
        return t1 + arr.join( t2 + t1) + t2;
    };

    if (active_user.plan === database.unlimitedPlanName)
        return format(v6 ? ifcv6_list : ifcv4_list);

    var plan = database.getPlan(active_user.plan);

    if (!v6) {
        if (!plan.plan_ipv4_pool)
            return { err : "PlanParentNoIPv4Pool" };

        return format(plan.plan_ipv4_pool);
    } else {
        if (!plan.plan_ipv6_pool)
            return { err : "PlanParentNoIPv6Pool" };

        return format(plan.plan_ipv6_pool);
    }
};