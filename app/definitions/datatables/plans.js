/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");

exports.name = path.basename(__filename, ".js").toLowerCase();

exports.settings = {
    columns :[ "_checkbox",  "_id", "plan_name", "suspended", "plan_disk_space", "plan_cpu", "plan_memory", "plan_max_domains", "plan_max_users", "user_owner_id"],
    addForm : "addPlan",
    addFormURL : "addplan.html"
};
