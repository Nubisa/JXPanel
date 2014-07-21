/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");


exports.settings = {
    columns :[ "_checkbox", "_id", "person_name", "person_email", "person_username" , "user_owner_id"],
    dbTable : sqlite.User,
    addForm : "addUser",
    addFormURL : "adduser.html"
};
