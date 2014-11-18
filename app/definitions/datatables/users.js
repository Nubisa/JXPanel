/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");


exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "UsersUpperCase";

exports.settings = {
    columns :[
        "_checkbox",
        "_id",
        "person_name",
        "suspended",
        {
            name : "person_email",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "person_username",
            class : "hidden-xs"
        },
        {
            name : "plan_table_id",
            class : "hidden-320 hidden-480"
        },
        {
            name : "ftp_access",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "panel_access",
            class : "hidden-xs"
        }
    ],
    addForm : "addUser",
    addFormURL : "adduser.html"
};
