/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
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
                    value_table: false
                }
            },
//
//            { name: "plan_overuse",
//                details: {
//                    label: "Overuse",
//                    method: tool.createCheckBox,
//                    options: { },
//                    validation: new validations.Boolean()
//                }
//            },
//
//            { name: "plan_disk_space",
//                details: {
//                    label: "MaxDiskSpace",
//                    method: tool.createTextBox,
//                    options: { suffix: " MB"}
//                },
//                validation: new validations.Int( { gte : 0})
//            },
//
//            { name: "plan_traffic",
//                details: {
//                    label: "MaxTraffic",
//                    method: tool.createTextBox,
//                    options: { suffix: " MB/month"}
//                }
////                validation : new validations.Int( { gte : 0 })
//            },
//
//            { name: "plan_memory",
//                details: {
//                    label: "MaxMemory",
//                    method: tool.createTextBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_cpu",
//                details: {
//                    label: "MaxCPU",
//                    method: tool.createTextBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_cpu_interval",
//                details: {
//                    label: "MaxCPUInterval",
//                    method: tool.createTextBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_domain_count",
//                details: {
//                    label: "MaxDomains",
//                    method: tool.createTextBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_ssl",
//                details: {
//                    label: "AllowSSL",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_custom_socket",
//                details: {
//                    label: "AllowCustomSocketPort",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_sys_exec",
//                details: {
//                    label: "AllowSysExec",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_local_native_modules",
//                details: {
//                    label: "AllowLocalNativeModules",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_app_log_web_access",
//                details: {
//                    label: "AppLogWebAccess",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_ssh",
//                details: {
//                    label: "AllowSSH",
//                    method: tool.createCheckBox,
//                    options: { }
//                }
//            },
//
//            { name: "plan_nginx_directives",
//                details: {
//                    label: "NginxDirectives",
//                    method: tool.createTextBox,
//                    options: { multiline : true }
//                }
//            },


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

//            { name: "sub_username",
//                details: {
//                    label: "Username",
//                    method: tool.createTextBox,
//                    options: { required: true, values: ["EN"]}
//                }
//            },
//
//            {name: "sub_password",
//                details: {
//                    label: "Password",
//                    method: tool.createTextBox,
//                    options: { required: true, password: true }
//                }
//            },
//
//            { name: "sub_repeatpassword",
//                details: {
//                    label: "PasswordRepeat",
//                    method: tool.createTextBox,
//                    options: { required: true, password: true },
//                    db: false
//                }
//            },

            {"END" : 1}
        ];
    };

    func.prototype.apply = function (active_user, params, cb) {

        var _controls = {};
        for(var a in this.controls) {
            var name = this.controls[a].name;
            if (name) _controls[name] = this.controls[a].details;
        }

        var values = params.controls;

        var addDomain = function () {
            // if arrived here - required fields are non empty

            var errors = [];
            var len = 0;
            for (var name in values) len++;
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

            sqlite.Domain.AddNew(sqlite.db, { domain_name: values["domain_name"] }, function (err, id) {

                if (err) {
                    if (cb) cb(err);
                } else {
                    for (var name in values) {
                        // only for defined columns
                        if (_controls[name]) {
                            var addValue = _controls[name].value_table !== false;
                            if (addValue) {
                                console.log("adding domain value", name, values[name]);
                                sqlite.Domain.AddNewFieldValue2(sqlite.db, id, name, values[name], _cb);
                            }
                        }
                    }
                    // to decrease the counter and call cb if needed
                    _cb(false);
                }
            });
        };

        sqlite.Domain.Get(sqlite.db, { domain_name: values["domain_name"]}, function (err, rows) {
            if (!err && rows && rows.length) {
                cb("Domain with this name already exists.")
            } else {
                addDomain();
            }
        })

    };

    return new func();
};
