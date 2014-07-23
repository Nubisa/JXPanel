/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var dbcache = require("./../../db/dbcache.js");
var path = require("path");
var validations = require('./../validations');
var crypto = require('crypto');

exports.form = function () {

    var func = function () {
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.onSubmitSuccess = "users.html";
        this.onSubmitCancel = "users.html";

        this.settings = {
            dbTable : sqlite.User,
            json_where :
            {
                insert : ["username"],
                update: ["ID"]
            }
        };

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
                    options: { required: true, values: ["EN"]},
                    dbTable : "main",
                    dbName : "username"
                }
            },

            {
                name: "person_password",
                details: {
                    label: "Password",
                    method: tool.createTextBox,
                    options: { required_insert: true, password: true, dont_update_null : true },
                    value_table: false,
                    dbTable : "none"
                },
                validation : new validations.String(5)
//                convert : function(value) {
//                    return crypto.createHash('md5').update(value).digest('hex').toString();
//                }
            },

            {
                name: "person_repeat_password",
                details: {
                    label: "PasswordRepeat",
                    method: tool.createTextBox,
                    options: { required_insert: true, password: true, dont_update_null : true  },
                    dbTable: "none"
                },
                validation : new validations.Password("person_password")
//                convert : function(value) {
//                    return crypto.createHash('md5').update(value).digest('hex').toString();
//                }
            },

            { name: "plan_table_id",
                details: {
                    label: "PlanID",
                    method: tool.createComboBox,
                    options: { required: true, dynamic: true },
                    dbTable : "main",
                    userCannotEditOwnRecord : true
                },
                dynamicValues : function(active_user, cb) {

                    if (!cb)
                        throw "Callback required.";

                    var basicRecords = active_user.checkHostingPlan.GetRecords();

                    dbcache.refresh(function(err) {
                        if (err) {
                            cb(err)
                        } else {
                            var plans = dbcache.Get(sqlite.plan_table, null, true);
                            var rows = plans.rec;
                            var ret = [ ];

                            if (!active_user.isSudo) {
                                // adding alias for hosting plan given to current user by parent user
                                var plan_id = basicRecords.user["plan_table_id"];
                                var display_name = dbcache.GetDisplayValue("plan_table_id", "@" + plan_id);
                                ret.push({ id : '@' + plan_id.replace("@", ""), txt : display_name });
                            }
                            active_user.checkHostingPlan.basicCheck();
                            for(var a in rows) {
                                if (active_user.checkHostingPlan.CanSeeRecord(sqlite.plan_table, rows[a], true)) {
                                    ret.push({ id : rows[a].ID, txt : rows[a].plan_name });
                                }
                            }
                            cb(false, ret);
                        }
                    });

                }
            },

            {"END": 1}
        ];
    };

    // obsolete
//    func.prototype.apply = function (active_user, params, cb) {
//
//        var _controls = {};
//        for(var a in this.controls) {
//            var name = this.controls[a].name;
//            if (name) _controls[name] = this.controls[a].details;
//        }
//
//        var values = params.controls;
//
//        var addUser = function() {
//
//            var errors = [];
//            var len = 0;
//            for (var name in values) len++;
//
//            var _cb = function (err) {
//                len--;
//                if (err) {
//                    errors.push(err);
//                }
//                if (len===0) {
//                    cb(null);
//                }
//
//            };
//
//            var crypto = require('crypto');
//            var encrypted = crypto.createHash('md5').update(values["person_password"]).digest('hex').toString();
//
//            sqlite.User.AddNew(sqlite.db, { username : values["person_username"], password : encrypted }, function(err, id) {
//
//                if (err) {
//                    if (cb) cb(err);
//                } else {
//                    for (var name in values) {
//                        // only for defined columns
//                        if (_controls[name]) {
//                            var addValue = _controls[name].value_table !== false;
//                            if (addValue) {
////                            console.log("adding", name, values[name]);
//                                sqlite.User.AddNewFieldValue2(sqlite.db, id, name, values[name], _cb);
//                                continue;
//                            }
//                        }
//                        // to decrease the counter and call cb if needed
//                        _cb(false);
//                    }
//                }
//            });
//        };
//
//        sqlite.User.Get(sqlite.db, { username : values["person_username"]}, function(err, rows) {
//            if (!err && rows && rows.length) {
//                cb(form_lang.Get(active_user.lang, "UserAlreadyExists"));
//            } else {
//                addUser();
//            }
//        })
//
//    };

    return new func();
};
