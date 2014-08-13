/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");


exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "DomainsUpperCase";

exports.settings = {
    columns :[ "_checkbox", "_id", "person_name", "suspended", "person_email", "person_username", "plan_table_id", "ftp_access", "panel_access"],
    addForm : "addUser",
    addFormURL : "adduser.html"
};
