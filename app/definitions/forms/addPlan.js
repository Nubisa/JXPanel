/**
 * Created by Nubisa Inc. on 7/11/14.
 */

var tool = require('./../../rendering/form_tools');
var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");


var os = require('os');
var ifcs = os.networkInterfaces();

var ifcv4_list = [];
var ifcv6_list = [];

var resetInterfaces = function(){
    ifcv4_list = [];
    for (var i in ifcs) {
        var arr = ifcs[i];
        for(var o in arr){
            if(arr[o])
            {
                if (arr[o].family === "IPv4")
                    ifcv4_list.push(arr[o].address);

                if (arr[o].family === "IPv6")
                    ifcv6_list.push(arr[o].address);
            }
        }
    }
}();



exports.form = function () {

    var func = function(){
        this.name = path.basename(__filename, ".js");

        this.controls = {
            "sub_domain_name": {
                label: "DomainName",
                method: tool.createTextBox,
                options: { required: true, prefix : "www."}
            },
            "sub_ipv4": {
                label: "IPv4",
                method: tool.createComboBox,
                options: { required: true, values : ifcv4_list }
            },
            "sub_ipv6": {
                label: "IPv6",
                method: tool.createComboBox,
                options: { required: true, values : ifcv6_list }
            },
            "sub_username": {
                label: "Username",
                method: tool.createTextBox,
                options: { required: true, values: ["EN"]}
            },
            "sub_password": {
                label: "Password",
                method: tool.createTextBox,
                options: { required: true, password: true }
            },
            "sub_repeatpassword": {
                label: "PasswordRepeat",
                method: tool.createTextBox,
                options: { required: true, password: true },
                db : false
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
