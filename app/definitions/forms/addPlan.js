/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");


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

        this.controls = [
            {"BEGIN": "User Details"},

            {
                name: "plan_name",
                details: {
                    label: "PlanName",
                    method: tool.createTextBox,
                    options: { required: true },
                    value_table: false
                }
            },

            { name: "plan_overuse",
                details: {
                    label: "Overuse",
                    method: tool.createCheckBox,
                    options: { },
                    validation: [ "bool" ]
                }
            },

            { name: "plan_disk_space",
                details: {
                    label: "MaxDiskSpace",
                    method: tool.createTextBox,
                    options: { suffix: " MB"},
                    validation: [ "int", "gte" , 0 ]
                }
            },

            { name: "plan_traffic",
                details: {
                    label: "MaxTraffic",
                    method: tool.createTextBox,
                    options: { suffix: " MB/month"}
                }
            },

            { name: "plan_memory",
                details: {
                    label: "MaxMemory",
                    method: tool.createTextBox,
                    options: { }
                }
            },

            { name: "plan_cpu",
                details: {
                    label: "MaxCPU",
                    method: tool.createTextBox,
                    options: { }
                }
            },

            { name: "plan_cpu_interval",
                details: {
                    label: "MaxCPUInterval",
                    method: tool.createTextBox,
                    options: { }
                }
            },

            { name: "plan_domain_count",
                details: {
                    label: "MaxDomains",
                    method: tool.createTextBox,
                    options: { }
                }
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

    func.prototype.apply = function (active_user, cb) {

        var userForm = active_user.session.forms[this.name];
        var _controls = this.controls;


        for (var name in _controls) {
            var ctrl = _controls[name];
//            console.log(name, name, "value", userForm[name]);
            if (ctrl.options) {
                if (ctrl.options.required && (!userForm || !userForm[name])) {
                    cb(form_lang.Get(active_user.lang, "ValueRequired") + ": `" + form_lang.Get(active_user.lang, ctrl.label) + "`.");
//                    console.log("NO VALUE");
                    return;
                }
            }
        }

        var addPlan = function () {
            // if arrived here - required fields are non empty

            var errors = [];
            var len = userForm;
            var _cb = function (err) {
                len--;
                if (err) {
                    errors.push(err);
                    console.error(err);
                }
                if (len === 0) {
                    cb(null);
                }

            };

            sqlite.Plan.AddNew(sqlite.db, { plan_name: userForm["plan_name"] }, function (err, id) {

                if (err) {
                    console.error(err);
                } else {
                    console.log("OK");
                }
                for (var name in userForm) {
                    // only for defined columns
                    if (_controls[name]) {
                        var addValue = _controls[name].value_table !== false;
                        if (addValue) {
                            console.log("adding plan value", name, userForm[name]);
                            sqlite.Plan.AddNewFieldValue2(sqlite.db, id, name, userForm[name], _cb);
                        }
                    }
                }
            });
        };

        sqlite.Plan.Get(sqlite.db, { username: userForm["plan_name"]}, function (err, rows) {
            if (!err && rows && rows.length) {
                cb("Plan with this name already exists.")
            } else {
                addPlan();
            }
        })

    };

    return new func();
};
