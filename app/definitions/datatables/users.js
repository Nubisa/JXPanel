/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");


exports.settings = {
    columns :[ "_checkbox", "_id", "person_name", "person_email", "person_username"],
    dbTable : sqlite.User,
    addForm : "addUser",
    addFormURL : "adduser.html"
};

//exports.getData = function(active_user, cb) {
//
//    if (!sqlite.db) {
//        cb(form_lang.Get(active_user.lang, "DBNotOpened"));
//        return;
//    }
//
//    sqlite.User.Get(sqlite.db, null, function(err, rows) {
//        if (err)
//            cb(err)
//        else {
//            cb(false, rows);
//        }
//
//    });
//
//};
