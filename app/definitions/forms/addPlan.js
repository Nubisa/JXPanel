/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');
var database = require("./../../install/database");
var util = require("util");
var ip_tools = require("./../../ip_tools");


exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "hostingp.html";
        this.onSubmitCancel = "hostingp.html";

        this.displayNameLabel_Add = "AddPlan";
        this.displayNameLabel_Edit = "EditPlan";

        this.tabs = [
            { label : "General Hosting Plan Settings", showAlways : false },
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
                },
                helpDescription: {
                    markdown : "Displays an information about hosting plan's current status. When the form is in {{labeli.Add}} mode, this value is empty, "
                    +"otherwise it may display one of the following statuses: {{labeli.Active}} or {{labeli.Suspended}}."
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
                validation: new validations.Boolean(),
                helpDescription: {
                    markdown : ""
                }
            },

            { name: "plan_nginx_directives",
                details: {
                    label: "NginxDirectives",
                    method: tool.createTextBox,
                    options: { multiline : true }
                },
                validation : new validations.NginxDirectives(),
                helpDescription: {
                    markdown : "Each of the domains configured in JXPanel has its own configuration file for NGINX."
                        + "Within this file domain is defined inside of [server](http://nginx.org/en/docs/http/ngx_http_core_module.html#server) block tag "
                        + "and these extra directives are added at the end of it."
                }
            },


            { name: "plan_ipv4_pool",
                details: {
                    label: "IPv4Pool",
                    method: tool.createCheckedListBox,
                    options: { required : true, required_label : "ValueRequiredAtLeastOne" },
                    getValuesList : function(active_user, values, listOrForm) {
                        return ip_tools.getUserIPs(active_user, false);
                    }
                },
                validation : new validations.IPAdresses(false),
                helpDescription: {
                    markdown : "This field contains one ore more IPv4 addresses selected to the hosting plan (to which currently logged-in user belongs) by a parent user."
                }
            },


            { name: "plan_ipv6_pool",
                details: {
                    label: "IPv6Pool",
                    method: tool.createCheckedListBox,
                    options: { required : true, required_label : "ValueRequiredAtLeastOne" },
                    getValuesList : function(active_user, values, listOrForm) {
                        return ip_tools.getUserIPs(active_user, true);
                    }
                },
                validation : new validations.IPAdresses(true),
                visibility : function(active_user, values, listOrForm) {
                    return ip_tools.getUserIPs(active_user, true).length > 0;
                },
                helpDescription: {
                    markdown : "This field is available only in case when the hosting plan, to which currently logged-in user belongs allows at least one of IPv6 addresses to use."+
                        "{{if.admin:true}}\n\n\tIf you are superuser, and you don't see this field, it means that the current server does not expose any public IPv6 addresses.{{endif}}"
                }
            },

            {"END" : 1}

        ];
    };

    return new func();
};
