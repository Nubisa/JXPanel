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
                    options : { value : process.jxversion }
                }
            },

            {
                name: "jx_path",
                details: {
                    label: "JXcorePath",
                    method: tool.createSimpleText,
                    options : { value : process.execPath }
                }
            },

            {"END" : 1},


            {"BEGIN": "JXcoreMonitor"},

            {
                name: "jx_monitor_status",
                details: {
                    label: "JXcoreMonitorStatus",
                    method: tool.createSimpleText,
                    options : {
                        value : function() {
                            return jxcore.monitor.isOnline
                                ? '<i class="fa-fw fa fa-check text-success">Online</i>'
                                : '<i class="fa-fw fa fa-times text-danger">Offline</i>';
                        }
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
