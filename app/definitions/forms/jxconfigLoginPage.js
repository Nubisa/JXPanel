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

        this.icon = '<i class="fa fa-fw fa-lg fa-sign-in"></i>';
        this.title = 'LoginPageCustom';

        this.onSubmitSuccess = "jxcoreloginpage.html";
        this.onSubmitCancel = "jxcoreloginpage.html";

        this.controls = [

            {"BEGIN": "Logo"},

            {
                name: "logo_header",
                details: {
                    label: "LogoHeader",
                    method: tool.createSimpleText,
                    dbName : null,
                    getValue : function(active_user) {
                        return page_utils.logo("logoSmall")
                    }
                }
            },

            {
                name: "logo_login_page",
                details: {
                    label: "LogoLoginPage",
                    method: tool.createSimpleText,
                    dbName : null,
                    getValue : function(active_user) {
                        return page_utils.logo("logoBig")
                    }
                }
            },

            {
                name: "logo_upload",
                details: {
                    label: " ",
                    method: tool.createSimpleText,
                    dbName : null,
                    getValue : function(active_user) {
                        var upload = page_utils.getSingleButton(form_lang.Get(active_user.lang, "LogoUpload", true), "fa-upload", "return window.jxUploadLogo();", false);

                        var str = database.getConfigValue("logo_custom");
                        var remove = !str ? "" : page_utils.getSingleButton(form_lang.Get(active_user.lang, "LogoRestore", true), "fa-trash-o", "return utils.jxCall('removeLogo')", false);
                        return page_utils.getButtonsGroup(upload + remove);
                    }
                }
            },

            {"END": 1},

            {"BEGIN": "LoginPage"},

            {
                name: "customLoginText",
                details: {
                    label: "LoginPageText",
                    method: tool.createTextBox,
                    options: { multiline: true , rows : 10 }
                }
            },

            {
                name: "defaultLoginText",
                details: {
                    label: "Example",
                    method: tool.createSimpleText,
                    dbName : null,
                    getValue : function(active_user) {

                        var view = fs.readFileSync( path.join(__dirname, '/../views/customLoginText.html')).toString();
                        return view.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g, "<br>").replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
                    }
                }
            },

            {"END": 1}
        ];
    };

    return new func();
};
