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

        this.onSubmitSuccess = "plans.html";
        this.onSubmitCancel = "plans.html";

        this.settings = {
            json_where :
            {
                insert : ["plan_name"],
                update: ["ID"]
            }
        };

        this.controls = [
            {"BEGIN": "User Details"},

            {
                name: "plan_name",
                details: {
                    label: "PlanName",
                    method: tool.createTextBox,
                    options: { required: true }
                }
            },

            {
                name: "user_owner_id",
                details: {
                    label: "Username",
                    method: null,
                    options: { }
                }
            },

            { name: "plan_overuse",
                details: {
                    label: "Overuse",
                    method: tool.createCheckBox,
                    options: { }
//                    displayAs : { true : "Allow", false : "Disallow" }
                },
                validation: new validations.Boolean()
            },

            { name: "plan_disk_space",
                details: {
                    label: "MaxDiskSpace",
                    method: tool.createTextBox,
                    options: { suffix: " MB"},
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_traffic",
                details: {
                    label: "MaxTraffic",
                    method: tool.createTextBox,
                    options: { suffix: " MB/month"},
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_memory",
                details: {
                    label: "MaxMemory",
                    method: tool.createTextBox,
                    options: { },
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_cpu",
                details: {
                    label: "MaxCPU",
                    method: tool.createTextBox,
                    options: { },
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_cpu_interval",
                details: {
                    label: "MaxCPUInterval",
                    method: tool.createTextBox,
                    options: { }
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_max_domains",
                details: {
                    label: "MaxDomains",
                    method: tool.createTextBox,
                    options: { },
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_ssl",
                details: {
                    label: "AllowSSL",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_custom_socket",
                details: {
                    label: "AllowCustomSocketPort",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_sys_exec",
                details: {
                    label: "AllowSysExec",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_local_native_modules",
                details: {
                    label: "AllowLocalNativeModules",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_app_log_web_access",
                details: {
                    label: "AppLogWebAccess",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_ssh",
                details: {
                    label: "AllowSSH",
                    method: tool.createCheckBox,
                    options: { }
                }
            },

            { name: "plan_nginx_directives",
                details: {
                    label: "NginxDirectives",
                    method: tool.createTextBox,
                    options: { multiline : true }
                }
            },

            { name: "plan_max_users",
                details: {
                    label: "MaxUsers",
                    method: tool.createTextBox,
                    options: {  },
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new function() {

                    this.validate = function (env, active_user, val, vals) {
                        return {result: false, msg : "Validation not implemented." };
                    };
                }
            },

            { name: "plan_max_plans",
                details: {
                    label: "MaxPlans",
                    method: tool.createTextBox,
                    options: {  },
                    nullDisplayAs : "ValueUnlimited"
                },
                validation: new validations.Int( { gte : 0})
            },

            // do not remove this yet, may be useful
//            "sub_domain_name": {
//                label: "DomainName",
//                method: tool.createTextBox,
//                options: { required: true, prefix : "www."}
//            },
//            "sub_ipv4": {
//                label: "IPv4",
//                method: tool.createComboBox,
//                options: { required: true, values : ifcv4_list }
//            },
//            "sub_ipv6": {
//                label: "IPv6",
//                method: tool.createComboBox,
//                options: { required: true, values : ifcv6_list }
//            },
//            "sub_username": {
//                label: "Username",
//                method: tool.createTextBox,
//                options: { required: true, values: ["EN"]}
//            },
//            "sub_password": {
//                label: "Password",
//                method: tool.createTextBox,
//                options: { required: true, password: true }
//            },
//            "sub_repeatpassword": {
//                label: "PasswordRepeat",
//                method: tool.createTextBox,
//                options: { required: true, password: true },
//                db : false
//            }

            {"END" : 1}
        ];
    };

    return new func();
};
