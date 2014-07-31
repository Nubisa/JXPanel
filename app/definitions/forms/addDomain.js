/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');

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


exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "domains.html";
        this.onSubmitCancel = "domains.html";

        this.controls = [
            {"BEGIN": "Domain Details"},

            {
                name: "domain_name",
                details: {
                    label: "DomainName",
                    method: tool.createTextBox,
                    options: { required: true, prefix: "www." },
                    dbName: "name", // alias to `name` in object database.getDomain();
                    cannotEdit: true
                },
                validation : new validations.Domain()
            },

            {
                name: "user_owner_id",
                details: {
                    label: "Username",
                    method: null,
                    options: { },
                    dbName: "owner" // alias to `owner` in object database.getDomain();
                }
            },

            // do not remove this yet, may be useful
            { name: "sub_ipv4",
                details: {
                    label: "IPv4",
                    method: tool.createComboBox,
                    options: { required: true, values: ifcv4_list }
                }},
            { name: "sub_ipv6",
                details: {
                    label: "IPv6",
                    method: tool.createComboBox,
                    options: { required: true, values: ifcv6_list }
                }
            },

            {"END" : 1},

            {"BEGIN": "JXcore options"},

            {
                name: "jx_enabled",
                details: {
                    label: "JXEnabled",
                    method: tool.createCheckBox,
                    options: { },
                    displayValues : {
                        "true" : '<i class="fa-fw fa fa-check text-success"></i>',
                        "false" : '<i class="fa-fw fa fa-times text-danger"></i>'
                    }
                },
                validation : new validations.Boolean()
            },

            {
                name: "jx_app_stats",
                details: {
                    label: "JXAppStatus",
                    method: tool.createSimpleText,
                    options: { dynamic : true }
                },
                dynamicValues : function(active_user) {
                    return "dynval";
                }
            },

            {
                name: "jx_app_path",
                details: {
                    label: "JXAppPath",
                    method: tool.createTextBox,
                    options: { default : "index.js" }
                }
            },

            { name: "jx_app_log_web_access",
                details: {
                    label: "AppLogWebAccess",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation : new validations.Boolean()
            },

            {"END" : 1}
        ];
    };

    return new func();
};
