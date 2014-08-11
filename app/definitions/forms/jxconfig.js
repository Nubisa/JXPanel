/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var fs = require("fs");
var validations = require('./../validations');
var database = require("./../../install/database");
var system_tools = require("./../../system_tools");
var site_defaults = require("./../site_defaults");

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

                        var cfg = database.getConfig();

                        var ok = cfg.jxPath && fs.existsSync(cfg.jxPath) && cfg.jxv;

                        return ok
                            ? '<i class="fa-lg fa fa-check text-success"></i>' + " " + form_lang.Get(active_user, "Installed", true) +  " " + cfg.jxv
                            : '<i class="fa-lg fa fa-times text-danger"></i>' + " " + form_lang.Get(active_user, "NotInstalled", true);
                    }
                }
            },

            {
                name: "jx_path",
                details: {
                    label: "JXcorePath",
                    method: tool.createSimpleText,
                    getValue : function(active_user) {

                        var cfg = database.getConfig();

                        if (cfg.jxPath) {
                            var str = cfg.jxPath;
                            if (!fs.existsSync(cfg.jxPath)) str += '<br><code>' + form_lang.Get(active_user.lang, "JXcorePathInvalid", true) +'</code>';
                            return str;
                        } else {
                            return "";
                        }
                    }
                }
            },

            {
                name: "jx_monitor_install",
                details: {
                    label: "",
                    method: tool.createSimpleText,
                    getValue : function(active_user) {

                        var cfg = database.getConfig();

                        var icon = cfg.jxPath ? "fa-refresh" : "fa-download";

                        var str =  '<button type="button" class="btn btn-labeled btn-success" onclick="return utils.jxInstall();"><span class="btn-label"><i class="fa fa-lg fa-fw ' + icon + '"></i></span>'
                            + form_lang.Get(active_user.lang, cfg.jxPath ? "Reinstall" : "Install", true) + '</button>';

                        if (cfg.jxPath)
                            str += '<p class="note">' + form_lang.Get(active_user.lang, "JXcoreReinstall_Description", true) + '</p>';

                        return str;
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
                    getDescription : function(active_user, values) {
                        return active_user.session.monitor.isOnline
                        ? form_lang.Get(active_user.lang, "JXcoreMonitorStatusStop_Description", true)
                        : form_lang.Get(active_user.lang, "JXcoreMonitorStatusStart_Description", true);
                    },
                    getValue : function(active_user) {

                            var btnStart = '<button type="submit" class="btn btn-labeled btn-success" onclick="return utils.jxMonitorStartStop(true);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-play"></i></span>'
                                + form_lang.Get(active_user.lang, "Start", true) + '</button>';

                            var btnStop = '<button type="button" class="btn btn-labeled btn-danger" onclick="return utils.jxMonitorStartStop(false);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-stop"></i></span>'
                                + form_lang.Get(active_user.lang, "Stop", true) + '</button>';


                            return active_user.session.monitor.isOnline
                                ? '<i class="fa-lg fa fa-check text-success"></i>' + " " + form_lang.Get(active_user.lang, "Online", true) +  btnStop
                                : '<i class="fa-lg fa fa-times text-danger"></i>' + " " + form_lang.Get(active_user.lang, "Offline", true) +  btnStart;
                    }
                }
            },

            {"END" : 1},


            {"BEGIN": "JXcoreConfiguration"},

            {
                name: "jx_app_min_port",
                details: {
                    label: "JXcoreAppMinPort",
                    method: tool.createTextBox,
                    options: { required: true },
                    getValue : function(active_user) {
                        return database.getConfigValue("jx_app_min_port") ||   site_defaults.defaultAppMinPort;
                    }
                },
                validation : new validations.Int({ gte : site_defaults.defaultAppMinPort, lte : site_defaults.defaultAppMaxPort })
            },

            {
                name: "jx_app_max_port",
                details: {
                    label: "JXcoreAppMaxPort",
                    method: tool.createTextBox,
                    options: { required: true },
                    getValue : function(active_user) {
                        return database.getConfigValue("jx_app_max_port") ||   site_defaults.defaultAppMaxPort;
                    }
                },
                validation : new validations.MaxPort("jx_app_min_port")
            },


            {
                name: "submit_warning",
                details: {
                    label: "",
                    method: tool.createSimpleText,
                    options: {  },
                    getValue : function(active_user) {
                        return '<code>' + form_lang.Get(active_user.lang, "JXcoreAppsRestartWarning", true ) +  '</code>'
                    }
                }
            },

            {"END": 1}
        ];
    };

    return new func();
};
