/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');
var hosting_tools = require("./../../hosting_tools");
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

        this.icon = '<i class="fa fa-fw fa-lg fa-external-link"></i>';

        this.onSubmitSuccess = "domains.html";
        this.onSubmitCancel = "domains.html";

        this.displayNameLabel_Add = "AddDomain";
        this.displayNameLabel_Edit = "EditDomain";

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

//            {
//                name: "jx_enabled",
//                details: {
//                    label: "JXEnabled",
//                    method: tool.createCheckBox,
//                    options: { },
//                    displayValues : {
//                        "true" : '<i class="fa-fw fa fa-check text-success"></i>',
//                        "false" : '<i class="fa-fw fa fa-times text-danger"></i>'
//                    }
//                },
//                validation : new validations.Boolean()
//            },

            {
                name: "jx_app_status",
                details: {
                    label: "JXcoreAppStatus",
                    method: tool.createSimpleText,
                    options: { },
                    getValue : function(active_user, values, listOrForm) {

                        // form is in "add" mode, not "edit"
                        if (!values || !values["name"])
                            return iconOffline;

                        var plan = database.getPlanByDomainName(values.name);

                        var domain_name = values["name"];

                        var domain = database.getDomain(domain_name);

                        var ports = '<div style="display: inline">'
                                + ' <span class="label label-info">TCP: '+ domain.port_http + '</span>'
                                + ' <span class="label label-info">TCPS: '+ domain.port_https + '</span>'
                                + '</div>'

                        var iconOnline = form_lang.GetBool(active_user.lang, true, "RunningOn") + ports;
                        var iconOffline = form_lang.GetBool(active_user.lang, false, null, "Offline");

                        var divId = jxcore.utils.uniqueId();

                        var btnStart = '<button type="button" class="btn btn-labeled btn-success" onclick="return utils.jxAppStartStop(true, \'' + domain_name + '\',' + divId + ');" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-play"></i></span>'
                            + form_lang.Get(active_user.lang, "Start", true) + '</button>';

                        var btnStop = '<button type="button" class="btn btn-labeled btn-danger" onclick="return utils.jxAppStartStop(false, \'' + domain_name + '\',' + divId + ');" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-stop"></i></span>'
                            + form_lang.Get(active_user.lang, "Stop", true) + '</button>';

//                        var btnViewLog = listOrForm ? "" : '<button type="button" class="btn btn-labeled btn-info" onclick="document.location = \'applog.html\'; return false;" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-pencil-square-o"></i></span>'
//                            + form_lang.Get(active_user.lang, "JXcoreAppViewLog", true) + '</button>';

                        var btnViewLog = "";

                        if (plan.suspended)
                            btnStart = btnStop = ". <code>" + form_lang.Get(active_user.lang, "PlanSuspended", true) + "</code>";

                        if (!active_user.session.monitor && !active_user.session.monitor.json)
                            return iconOffline + ". " + form_lang.Get(active_user.lang, "JXcoreMonitorNotRunning", true);

                        var ret = hosting_tools.appGetSpawnerPath(domain_name);
                        if (ret.err)
                            return ret.err;

                        var json = "";
                        if (active_user.session.monitor) {
                            json = active_user.session.monitor.json || "";
                        }
                        if (!json)
                            btnStart = btnStop = ". " + form_lang.Get(active_user.lang, "JXcoreMonitorNotRunning", true);

                        var divStart = '<div id="jxAppStatus_' + divId +'" style="display: inline-block; white-space: nowrap;">';
                        var divEnd = "</div>";

                        if (json.indexOf(ret) === -1) {
                            return divStart + iconOffline + btnStart + btnViewLog + divEnd;
                        } else {
                            return divStart + iconOnline + btnStop + btnViewLog + divEnd;
                        }
                    }
                }
            },

            {
                name: "jx_app_path",
                details: {
                    label: "JXcoreAppPath",
                    method: tool.createTextBox,
                    options: { default : "index.js" }
                },
                validation : new validations.FileName()
            },

            { name: "jx_web_log",
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
