/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");

exports.settings = {
    columns :[ "_checkbox",  "_id", "domain_name", "user_owner_id" ],
    dbTable : sqlite.Domain,
    addForm : "addDomain",
    addFormURL : "adddomain.html"
};
