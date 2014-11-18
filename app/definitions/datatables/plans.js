/**
 * Created by Nubisa Inc. on 7/15/14.
 */

var form_lang = require('../form_lang');
var path = require("path");

exports.name = path.basename(__filename, ".js").toLowerCase();
exports.displayNameLabel = "DataPlans";

exports.settings = {
    columns :[
        "_checkbox",
        "_id",
        "plan_name",
        "suspended",
        {
            name : "plan_disk_space",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "plan_cpu",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "plan_memory",
            class : "hidden-xs hidden-sm"
        },
        {
            name : "plan_max_domains",
            class : "hidden-480"
        },
        {
            name : "plan_max_users",
            class : "hidden-480"
        },
        {
            name : "user_owner_id",
            class : "hidden-xs"
        }
    ],
    addForm : "addPlan",
    addFormURL : "addplan.html"
};
