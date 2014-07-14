/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");


exports.form = function () {

    var func = function(){
        this.name = "addUser";
        this.controls = {
            "person_name": {
                label: "UserContactName",
                method: tool.createTextBox,
                options: { required: true }
            },
            "person_email": {
                label: "UserEmailAddress",
                method: tool.createTextBox,
                options: { required: true }
            },
            "person_subscriptions": {
                label: "UserSubscriptionAccess",
                method: tool.createCheckList,
                options: { values: ["ALL"] }
            },
            "person_lang": {
                label: "UserPanelLanguage",
                method: tool.createComboBox,
                options: { values: ["EN"]}
            },
            "person_username": {
                label: "Username",
                method: tool.createTextBox,
                options: { required: true, values: ["EN"]}
            },
            "person_password": {
                label: "Password",
                method: tool.createTextBox,
                options: { required: true, password: true }
            }
        };
    };

    func.prototype.apply = function (active_user, cb) {

        var userForm = active_user.session.forms[this.name];
        var _controls = this.controls;


        for (var name in _controls) {
            var ctrl = _controls[name];
            if (ctrl.options) {
                if (ctrl.options.required && (!userForm || !userForm[name])) {
                    cb(form_lang.Get(active_user.lang, "ValueRequired") + ": `" + form_lang.Get(active_user.lang, ctrl.label) + "`.");
                    return;
                }
            }
        }

        var addUser = function() {
            // if arrived here - required fields are non empty

            var errors = [];
            var len = userForm;
            var _cb = function (err) {
                len--;
                if (err) {
                    errors.push(err);
                    console.error(err);
                }
                if (len===0) {
                    cb(null);
                }

            };

            var crypto = require('crypto');
            var encrypted = crypto.createHash('md5').update(userForm["person_password"]).digest('hex').toString();


            sqlite.User.AddNew(sqlite.db, { username : userForm["person_username"], password : encrypted }, function(err, id) {
                for (var name in userForm) {
                    // only for defined columns
                    if (_controls[name]) {
                        sqlite.User.AddNewFieldValue2(sqlite.db, id, name, userForm[name], _cb);
                    }
                }
            });
        };

        sqlite.User.Get(sqlite.db, { username : userForm["person_username"]}, function(err, rows) {
            if (!err && rows && rows.length) {
                cb("User already exists.")
            } else {
                addUser();
            }
        })

    };

    return new func();
};
