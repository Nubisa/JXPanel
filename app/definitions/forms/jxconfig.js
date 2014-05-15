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
var hosting_tools = require("./../../hosting_tools");
var site_defaults = require("./../site_defaults");
var page_utils = require('./../../rendering/page_utils');


exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<img id="jxcore_img" class="menu-icon" src="icons/jxcore.png">';

        this.onSubmitSuccess = "jxcore.html";
        this.onSubmitCancel = "jxcore.html";

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

                        var not_installed = '<code>' + form_lang.Get(active_user.lang, "JXcoreNotInstalled", true) +'</code>';
                        if (cfg.jxPath) {
                            var str = cfg.jxPath;
                            if (!fs.existsSync(cfg.jxPath)) str += '<br>' + not_installed;
                            return str;
                        } else {
                            return not_installed;
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

//                        var str =  '<button type="button" class="btn btn-labeled btn-success" onclick="return utils.jxInstall();"><span class="btn-label"><i class="fa fa-lg fa-fw ' + icon + '"></i></span>'
//                            + form_lang.Get(active_user.lang, cfg.jxPath ? "Reinstall" : "Install", true) + '</button>';

                        var label = form_lang.Get(active_user.lang, cfg.jxPath ? "Reinstall" : "Install", true);
                        var str = page_utils.getSingleButton(label, icon, 'return utils.jxInstall();');

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
                        return form_lang.Get(active_user.lang, active_user.session.monitor.isOnline ? "JXcoreMonitorStatusStop_Description" :"JXcoreMonitorStatusStart_Description", true);
                    },
                    getValue : function(active_user) {

                        var jxPath = hosting_tools.getJXPath();

                        var style = "margin-left: 15px;"
                        var btnStart = page_utils.getSingleButton(form_lang.Get(active_user.lang, "Start", true), "fa-play", 'return utils.jxMonitorStartStop(true);', style);
                        var btnStop = page_utils.getSingleButton(form_lang.Get(active_user.lang, "Stop", true), "fa-stop", 'return utils.jxMonitorStartStop(false);', style);

                        if (jxPath.err) {
                            btnStart = ". " + form_lang.Get(active_user.lang, jxPath.err, true);
                        }

                        var ret = form_lang.GetBool(active_user.lang, active_user.session.monitor.isOnline, "Online" + btnStop, "Offline" + btnStart);
                        return ret;
                    }
                }
            },

            {
                name: "jx_monitor_api",
                details: {
                    label: "JXcoreMonitorAllowMonitorAPI",
                    method: tool.createCheckBox,
                    options: { }
                },
                validation : new validations.Boolean()
            },

            {"END" : 1},


            {"BEGIN": "JXcoreConfiguration"},

            {
                name: "jx_app_min_port",
                details: {
                    label: "JXcoreAppMinPort",
                    method: tool.createTextBox,
                    options: { required: true, default: site_defaults.defaultAppMinPort }
                },
                validation : new validations.Int({ gte : site_defaults.defaultAppMinPort, lte : site_defaults.defaultAppMaxPort })
            },

            {
                name: "jx_app_max_port",
                details: {
                    label: "JXcoreAppMaxPort",
                    method: tool.createTextBox,
                    options: { required: true, default : site_defaults.defaultAppMaxPort }
                },
                validation : new validations.MaxPort("jx_app_min_port")
            },

            {"INFO" : "JXcoreAppsRestartWarning" },

            {"END": 1}
        ];
    };

    return new func();
};
