/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');
var database = require("./../../db/database");

exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "jxconfig.html";
        this.onSubmitCancel = "jxconfig.html";

        this.controls = [

            {"BEGIN": "JXcoreInfo"},

            {
                name: "jx_version",
                details: {
                    label: "JXcoreVersion",
                    method: tool.createSimpleText,
                    getValue : function(active_user) {
                        return process.jxversion;
                    }
                }
            },

            {
                name: "jx_path",
                details: {
                    label: "JXcorePath",
                    method: tool.createSimpleText,
                    getValue : function(active_user) {
                        return process.execPath;
                    }
                }
            },

            {"END" : 1},


            {"BEGIN": "JXcoreMonitor"},

            {
                name: "jx_monitor_status",
                details: {
                    label: "JXcoreMonitorStatus",
                    method: tool.createSimpleText,
                    getValue : function(active_user) {

                        var btnStart = '<button class="btn btn-labeled btn-success" onclick="return utils.jxMonitorStartStop(true);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-play"></i></span>'
                            + form_lang.Get(active_user.lang, "Start", true) + '</button>';

                        var btnStop = '<button class="btn btn-labeled btn-danger" onclick="return utils.jxMonitorStartStop(false);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-stop"></i></span>'
                            + form_lang.Get(active_user.lang, "Stop", true) + '</button>';

                        return jxcore.monitor.isOnline
                            ? '<i class="fa-lg fa fa-check text-success"></i>' + " " + form_lang.Get(active_user, "Online", true) +  btnStop
                            : '<i class="fa-lg fa fa-times text-danger"></i>' + " " + form_lang.Get(active_user, "Offline", true) +  btnStart
                    }
                }
            },

            {"END" : 1},


            {"BEGIN": "JXcoreConfiguration"},

            {
                name: "jx_app_min_port",
                details: {
                    label: "JXAppMinPort",
                    method: tool.createTextBox,
                    options: { required: true }
                },
                validation : new validations.Int({ gte : 10000, lte : 20000 })
            },

            {
                name: "jx_app_max_port",
                details: {
                    label: "JXAppMaxPort",
                    method: tool.createTextBox,
                    options: { required: true }
                },
                validation : new validations.MaxPort("jx_app_min_port")
            },


            {"END": 1}
        ];
    };

    return new func();
};
