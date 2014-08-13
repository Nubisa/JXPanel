/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var path = require("path");
var validations = require('./../validations');
var database = require("./../../install/database");

exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "users.html";
        this.onSubmitCancel = "users.html";

        this.displayNameLabel_Add = "AddUser";
        this.displayNameLabel_Edit = "EditUser";

        this.controls = [
            {"BEGIN": "User Details"},

            {
                name: "person_name",
                details: {
                    label: "UserContactName",
                    method: tool.createTextBox,
                    options: { required: true }
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

                        var user = database.getUser(values.name);

                        if (user.suspended) {
                            var reason = tool.getFieldDisplayNames(active_user.lang, user.suspended);
                            return iconOffline + " (" + reason + ")";
                        } else {
                            return iconOnline;
                        }
                    }
                }
            },


            {
                name: "person_email",
                details: {
                    label: "UserEmailAddress",
                    method: tool.createTextBox,
                    options: { required: true }
                },
                validation : new validations.Email()
            },

            {
                name: "person_lang",
                details: {
                    label: "UserPanelLanguage",
                    method: tool.createComboBox,
                    options: { values: ["EN"]}
                }
            },

            {
                name: "person_username",
                details: {
                    label: "Username",
                    method: tool.createTextBox,
                    options: { required: true },
                    dbName: "name",  // alias to name in database.getUser() object,
                    cannotEdit: true
                },
                validation : new validations.UserName()
            },

            {
                name: "person_password",
                details: {
                    label: "Password",
                    method: tool.createTextBox,
                    options: { required_insert: true, password: true, dont_update_null : true },
                    dbName: false
                },
                validation : new validations.Password("person_repeat_password")
            },

            {
                name: "person_repeat_password",
                details: {
                    label: "PasswordRepeat",
                    method: tool.createTextBox,
                    options: { required_insert: true, password: true, dont_update_null : true  },
                    dbName: false
                },
                validation : new validations.Password("person_password")
            },

            { name: "plan_table_id",
                details: {
                    label: "PlanID",
                    method: tool.createComboBox,
                    options: { required: true, dynamic: true },
                    dbName: "plan",
                    cannotEditOwnRecord : true
                },
                validation : new function () {

                    this.validate = function (env, active_user, val) {

                        var me = database.getUser(active_user.username);
                        // allows to select only existent plan
                        var plans = database.getPlansByUserName(active_user.username, 1);
                        plans.push(me.plan);

                        if (plans.indexOf(val) === -1)
                            return {result: false, msg: form_lang.Get(active_user.lang, "PlanInvalid", null)};

                        return {result: true};
                    };
                },
                dynamicValues : function(active_user) {

                    var plans = database.getPlansByUserName(active_user.username, 1);
                    var me = database.getUser(active_user.username);

                    var ret = [ ];
                    ret.push({ id : me.plan, txt : me.plan });

                    for(var i in plans) {
                        ret.push({ id : plans[i], txt : plans[i] });
                    }
                    return ret;
                }
            },


            {
                name: "ftp_access",
                details: {
                    label: "UserFTPAccess",
                    method: tool.createCheckBox,
                    options: { },
                    cannotEditOwnRecord : true,
                    getValue : function(active_user, values) {
                        return form_lang.GetBool(active_user.lang, values["ftp_access"], "Granted", "Denied");
                    }
                },
                validation : new validations.Boolean()
            },

            {
                name: "panel_access",
                details: {
                    label: "UserPanelAccess",
                    method: tool.createCheckBox,
                    options: { },
                    cannotEditOwnRecord : true,
                    getValue : function(active_user, values) {
                        return form_lang.GetBool(active_user.lang, values["panel_access"], "Granted", "Denied");
                    }
                },
                validation : new validations.Boolean()
            },

            {"END": 1}
        ];
    };

    return new func();
};
