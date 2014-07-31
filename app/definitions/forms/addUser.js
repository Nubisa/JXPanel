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
                name: "person_email",
                details: {
                    label: "UserEmailAddress",
                    method: tool.createTextBox,
                    options: { required: true }
                },
                validation : new validations.Email()
            },

//            {
//                name: "person_subscriptions",
//                details: {
//                    label: "UserSubscriptionAccess",
//                    method: tool.createComboBox,
//                    options: { values: ["ALL"] }
//                }
//            },

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
                validation : new validations.String(5)
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

            {"END": 1}
        ];
    };

    return new func();
};
