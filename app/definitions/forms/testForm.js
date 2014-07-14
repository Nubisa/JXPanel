/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");

exports.form = function () {

    var func = function(){
        this.name = path.basename(__filename, ".js");

        this.icon = '<span class="widget-icon"> <i class="fa fa-gear"></i> </span>';

        this.controls = [
            {"BEGIN" : "User Details"},

            {
                name:"person_name",
                details:{
                    label: "UserContactName",
                    method: tool.createTextBox,
                    options: { required: true, description : "Some description 2"}
                }
            },

            {
                name:"person_email",
                details:{
                    label: "UserPassword",
                    method: tool.createTextBox,
                    options: { required: true, password:true }
                }
            },

            {
                name:"person_combo",
                details:{
                    label: "UserCombo",
                    method: tool.createComboBox,
                    options: { values:["a", "b", "c"]}
                }
            },

            {
                name:"person_check",
                details:{
                    label: "UserCheck",
                    method: tool.createCheckBox,
                    options: { required:true }
                }
            },

            {"END" : 1}
        ];
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
