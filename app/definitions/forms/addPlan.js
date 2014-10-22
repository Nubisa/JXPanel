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

        this.onSubmitSuccess = "hostingp.html";
        this.onSubmitCancel = "hostingp.html";

        this.displayNameLabel_Add = "AddPlan";
        this.displayNameLabel_Edit = "EditPlan";

        this.tabs = [
            { label : "General Hosting Plan Settings", showAlways : true },
            { label : "Addons' settings" }
        ];

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
                    method: tool.createSimpleText,
                    options: { },
                    getValue : function(active_user, values) {

                        // form is in "add" mode, not "edit"
                        if (!values || !values["name"])
                            return "";

                        var iconOnline = form_lang.GetBool(active_user.lang, true, "Active");
                        var iconOffline = form_lang.GetBool(active_user.lang, false, null, "Suspended");

                        var plan = database.getPlan(values.name);
                        var parentPlanName = database.getParentPlanName(values.name);
                        var parentPlan = database.getPlan(parentPlanName);

                        if (plan.suspended) {
                            var reason = tool.getFieldDisplayNames(active_user.lang, plan.suspended, parentPlan);
                            return iconOffline + " (" + reason + ")";
                        } else {
                            return iconOnline;
                        }
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
                },
                validation : new validations.NginxDirectives()
            },

            {"END" : 1},

        ];
    };

    return new func();
};
