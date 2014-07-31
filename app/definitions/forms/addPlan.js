/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');
var database = require("./../../install/database");

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

        this.controls = [
            {"BEGIN": "General"},

            {
                name: "plan_name",
                details: {
                    label: "PlanName",
                    method: tool.createTextBox,
                    options: { required: true },
                    dbName: "name",
                    cannotEdit: true
                },
                validation : new validations.Plan()
            },

            {
                name: "user_owner_id",
                details: {
                    label: "Username",
                    method: null,
                    options: { },
                    dbName: "owner"
                }
            },

            {
                name: "suspended",
                details: {
                    label: "Status",
                    method: null,
                    options: { },
                    displayValues : {
                        "true" : '<i class="fa-fw fa fa-times text-danger"></i>',
                        "false" : '<i class="fa-fw fa fa-times text-success"></i>'
                    },
                    getValue : function(active_user, values) {

                        // form is in "add" mode, not "edit"
                        if (!values || !values["name"])
                            return "";

                        var iconOnline = '<i class="fa-lg fa fa-check text-success"></i> ' + form_lang.Get(active_user.lang, "Active", true);
                        var iconOffline = '<i class="fa-fw fa fa-times text-danger"></i> <code>' + form_lang.Get(active_user.lang, "Suspended", true) + "</code>";

                        var plan = database.getPlan(values.name);

                        return plan.suspended ? iconOffline : iconOnline;
                    }
                }
            },


//            { name: "plan_overuse",
//                details: {
//                    label: "Overuse",
//                    method: tool.createCheckBox,
//                    options: { },
//                    displayValues : {
//                        "true" : "allow",
//                        "false" : "disallow"
//                    }
//                },
//                validation: new validations.Boolean()
//            },

            { END : 1},

            {"BEGIN": "Hosting Plan Limits"},

            { name: "plan_disk_space",
                details: {
                    label: "MaxDiskSpace",
                    method: tool.createTextBox,
                    options: { suffix: " MB"},
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    definesMax: true
                },
                validation: new validations.Int({ gte : 0})
            },

            { name: "plan_traffic",
                details: {
                    label: "MaxTraffic",
                    method: tool.createTextBox,
                    options: { suffix: " MB/month"},
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    definesMax: true
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_max_domains",
                details: {
                    label: "MaxDomains",
                    method: tool.createTextBox,
                    options: { required : true },
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    dbName: "maxDomainCount"
//                    definesMax: true
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_max_users",
                details: {
                    label: "MaxUsers",
                    method: tool.createTextBox,
                    options: { required : true },
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    dbName: "maxUserCount"
//                    definesMax: true
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_max_plans",
                details: {
                    label: "MaxPlans",
                    method: tool.createTextBox,
                    options: {  },
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    definesMax: true
                },
                validation: new validations.Int( { gte : 0})
            },

            {"END" : 1},

            {"BEGIN": "JXcore application options"},

            { name: "plan_memory",
                details: {
                    label: "MaxMemory",
                    method: tool.createTextBox,
                    options: { },
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    definesMax: true
                },
                validation: new validations.Int( { gte : 0})
            },

            { name: "plan_cpu",
                details: {
                    label: "MaxCPU",
                    method: tool.createTextBox,
                    options: { },
                    displayValues : {
                        "__EMPTY__" : "@ValueUnlimited"
                    },
                    definesMax: true
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

//            { name: "plan_ssl",
//                details: {
//                    label: "AllowSSL",
//                    method: tool.createCheckBox,
//                    options: { }
//                },
//                validation: new validations.Boolean()
//            },

            { name: "plan_custom_socket",
                details: {
                    label: "AllowCustomSocketPort",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation: new validations.Boolean()
            },

            { name: "plan_sys_exec",
                details: {
                    label: "AllowSysExec",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation: new validations.Boolean()
            },

            { name: "plan_local_native_modules",
                details: {
                    label: "AllowLocalNativeModules",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation: new validations.Boolean()
            },

//            { name: "plan_app_log_web_access",
//                details: {
//                    label: "AppLogWebAccess",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },

            {"END" : 1},

            {"BEGIN": "System options"},

            { name: "plan_ssh",
                details: {
                    label: "AllowSSH",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation: new validations.Boolean()
            },

            { name: "plan_nginx_directives",
                details: {
                    label: "NginxDirectives",
                    method: tool.createTextBox,
                    options: { multiline : true }
                }
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
