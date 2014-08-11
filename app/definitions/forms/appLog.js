/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var fs = require("fs");
var validations = require('./../validations');
var hosting_tools = require("./../../hosting_tools");
var database = require("./../../install/database");


exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "appLog.html";
        this.onSubmitCancel = "domains.html";

        this.submitOnClick = "return utils.jxAppViewLog();",

        this.controls = [
            {"BEGIN": "Application log"},

            {
                name: "app_log_size",
                details: {
                    label: "JXcoreAppLogSize",
                    method: tool.createSimpleText,
                    options: {  },
                    getValue : function(active_user, values) {

                        var btnClearLog = '<button id="jxAppLogClearBtn" type="button" class="btn btn-labeled btn-info" onclick="return utils.jxAppViewLog(true);" style="margin-left: 20px;"><span class="btn-label"><i class="fa fa-lg fa-fw fa-times"></i></span>'
                            + form_lang.Get(active_user.lang, "JXcoreAppLogClear", true) + '</button>';

                        return '<span id="jxAppLogSize"></span>' + btnClearLog;
                    }
                }
            },

            {
                name: "app_log_last_lines",
                details: {
                    label: "JXcoreAppLogLines",
                    method: tool.createTextBox,
                    options: { default : 200 }//,
//                    getValue : function(active_user, values) {
//
//                    }
                }
            },

            {"END" : 1},
        ];

    };

    return new func();
};
