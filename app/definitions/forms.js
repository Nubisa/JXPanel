/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../rendering/form_tools');
var form_lang = require('../definitions/form_lang');
var sqlite = require("./../db/sqlite.js");


exports.forms = {};

exports.forms["addUser"] = new function () {

    var form_name = "addUser";

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

    this.apply = function (active_user, cb) {

        var userForm = active_user.session.forms[form_name];

        for (var name in this.controls) {
            var ctrl = this.controls[name];
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
                    sqlite.User.AddNewFieldValue2(sqlite.db, id, name, userForm[name], _cb);
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
};
