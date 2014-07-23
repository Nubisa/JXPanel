/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var sqlite = require("./../../db/sqlite.js");
var path = require("path");

exports.settings = {
    columns :[ "_checkbox",  "_id", "plan_name", "plan_disk_space", "plan_cpu", "plan_memory", "plan_max_domains", "plan_max_users", "user_owner_id"],
    dbTable : sqlite.Plan,
    addForm : "addPlan",
    addFormURL : "addplan.html"
};
